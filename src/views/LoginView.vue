<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'

import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Divider from 'primevue/divider'

import {
  checkWebAuthnSupport,
  registerPasskey,
  loginWithPasskey,
} from '../services/webauthService'

const router = useRouter()

const mode = ref<'welcome' | 'access' | 'login' | 'register'>('welcome')

const email = ref('demo@freshflow.local')
const password = ref('demo123')

const registerName = ref('')
const registerEmail = ref('')
const registerPassword = ref('')

const loginSuccess = ref(false)
const loginError = ref(false)

const registerSuccess = ref(false)
const registerError = ref(false)

const biometricLoading = ref(false)
const biometricSuccess = ref(false)
const biometricError = ref(false)

const webauthnSupported = ref(false)
const platformAvailable = ref(false)

const passkeyLoading = ref(false)
const passkeySuccess = ref('')
const passkeyError = ref('')
const passkeyLoginLoading = ref(false)
const passkeyLoginSuccess = ref('')
const passkeyLoginError = ref('')

onMounted(async () => {
  try {
    const support = await checkWebAuthnSupport()

    webauthnSupported.value = support.supported
    platformAvailable.value = support.platformAvailable
  } catch {
    webauthnSupported.value = false
    platformAvailable.value = false
  }
})

function resetMessages(): void {
  loginSuccess.value = false
  loginError.value = false
  registerSuccess.value = false
  registerError.value = false
  biometricSuccess.value = false
  biometricError.value = false
  passkeySuccess.value = ''
  passkeyError.value = ''
  passkeyLoginSuccess.value = ''
  passkeyLoginError.value = ''
}

function showAccess(): void {
  mode.value = 'access'
  resetMessages()
}

function showLogin(): void {
  mode.value = 'login'
  resetMessages()
}

function showRegister(): void {
  mode.value = 'register'
  resetMessages()
}

function showWelcome(): void {
  mode.value = 'welcome'
  resetMessages()
}

function login(): void {
  if (email.value && password.value) {
    loginSuccess.value = true
    loginError.value = false

    localStorage.setItem(
      'smart-grocery-demo-user',
      JSON.stringify({
        email: email.value,
        name: 'Demo User',
        loginMethod: 'demo-login',
      }),
    )

    setTimeout(() => router.push('/'), 1000)
  } else {
    loginError.value = true
    loginSuccess.value = false
  }
}

function register(): void {
  if (registerName.value && registerEmail.value && registerPassword.value) {
    registerSuccess.value = true
    registerError.value = false

    localStorage.setItem(
      'smart-grocery-demo-user',
      JSON.stringify({
        email: registerEmail.value,
        name: registerName.value,
        loginMethod: 'simulated-register',
      }),
    )

    setTimeout(() => router.push('/'), 1000)
  } else {
    registerError.value = true
    registerSuccess.value = false
  }
}
async function handleRegisterPasskey(): Promise<void> {
  passkeySuccess.value = ''
  passkeyError.value = ''

  if (!registerEmail.value) {
    console.warn('[WebAuthn] registration aborted: missing email')
    passkeyError.value = 'Bitte geben Sie eine E-Mail-Adresse ein.'
    return
  }

  try {
    passkeyLoading.value = true

    console.log('[WebAuthn] registration started', {
      email: registerEmail.value,
      name: registerName.value || registerEmail.value,
    })

    const result = await registerPasskey(
      registerEmail.value,
      registerName.value || registerEmail.value,
    )

    console.log('[WebAuthn] registration finished', result)

    if (result.verified) {
      passkeySuccess.value = 'Passkey wurde erfolgreich registriert.'
    } else {
      passkeyError.value = 'Passkey konnte nicht registriert werden.'
    }
  } catch (error: unknown) {
    console.error('[WebAuthn] registration failed', error)

    passkeyError.value =
      error instanceof Error
        ? error.message
        : 'Fehler bei der Passkey-Registrierung.'
  } finally {
    passkeyLoading.value = false
  }
}

async function handleLoginWithPasskey(): Promise<void> {
  passkeyLoginSuccess.value = ''
  passkeyLoginError.value = ''

  if (!email.value) {
    passkeyLoginError.value = 'Bitte geben Sie die E-Mail-Adresse ein, mit der der Passkey registriert wurde.'
    return
  }

  try {
    passkeyLoginLoading.value = true

    const result = await loginWithPasskey(email.value)

    if (result.verified && result.user) {
      localStorage.setItem(
        'smart-grocery-demo-user',
        JSON.stringify({
          email: result.user.email,
          name: result.user.name || 'Passkey User',
          loginMethod: 'webauthn-passkey',
        }),
      )

      passkeyLoginSuccess.value = 'Passkey-Anmeldung erfolgreich. Weiterleitung zum Dashboard...'

      setTimeout(() => router.push('/'), 1000)
    } else {
      passkeyLoginError.value = 'Passkey-Anmeldung konnte nicht verifiziert werden.'
    }
  } catch (error: unknown) {
    passkeyLoginError.value =
      error instanceof Error
        ? error.message
        : 'Fehler bei der Passkey-Anmeldung.'
  } finally {
    passkeyLoginLoading.value = false
  }
}
function continueAsGuest(): void {
  localStorage.setItem(
    'smart-grocery-demo-user',
    JSON.stringify({
      email: 'guest@freshflow.local',
      name: 'Guest User',
      loginMethod: 'guest',
    }),
  )

  router.push('/')
}

function loginWithFingerprint(): void {
  biometricLoading.value = true
  biometricSuccess.value = false
  biometricError.value = false

  setTimeout(() => {
    localStorage.setItem(
      'smart-grocery-demo-user',
      JSON.stringify({
        email: 'biometric@freshflow.local',
        name: 'Biometric Demo User',
        loginMethod: 'fingerprint-simulation',
      }),
    )

    biometricLoading.value = false
    biometricSuccess.value = true

    setTimeout(() => router.push('/'), 1200)
  }, 1500)
}
</script>

<template>
  <main class="access-page">
    <!-- ═══ WELCOME MODE ═══ -->
    <div
      v-if="mode === 'welcome'"
      class="flex flex-col items-center text-center gap-4 max-w-[500px] w-full py-8 px-6"
    >
      <div class="brand-badge">
        <i class="pi pi-leaf" />
      </div>

      <h1 class="text-[3rem] font-extrabold m-0 text-[#111827] tracking-tight leading-[1.1]">
        FreshFlow
      </h1>

      <p class="text-[1.05rem] font-semibold text-[#16a34a] m-0">
        Smart Grocery Assistant
      </p>

      <p class="text-[1rem] text-[#4b5563] m-0 leading-relaxed max-w-[420px]">
        Organisiere deinen Vorrat, plane Einkäufe einfacher und behalte Ablaufdaten
        sowie Reste im Blick.
      </p>

      <ul class="list-none mt-2 mb-1 p-0 flex flex-col gap-[0.7rem] self-stretch max-w-[360px] mx-auto">
        <li class="flex items-center justify-center gap-[0.65rem] text-[0.9rem] text-[#374151] font-medium">
          <i class="pi pi-check-circle text-base text-[#16a34a] shrink-0 w-[1.1rem] text-center" />
          <span>Lebensmittel im Blick behalten</span>
        </li>

        <li class="flex items-center justify-center gap-[0.65rem] text-[0.9rem] text-[#374151] font-medium">
          <i class="pi pi-shopping-cart text-base text-[#16a34a] shrink-0 w-[1.1rem] text-center" />
          <span>Einkaufsliste schneller planen</span>
        </li>

        <li class="flex items-center justify-center gap-[0.65rem] text-[0.9rem] text-[#374151] font-medium">
          <i class="pi pi-clock text-base text-[#16a34a] shrink-0 w-[1.1rem] text-center" />
          <span>Ablaufdaten rechtzeitig erkennen</span>
        </li>
      </ul>

      <Button
        label="Loslegen"
        icon="pi pi-arrow-right"
        icon-pos="right"
        class="mt-2 px-9 py-3 text-[1.05rem] font-semibold"
        type="button"
        @click="showAccess"
      />
    </div>

    <!-- ═══ ACCESS / LOGIN / REGISTER ═══ -->
    <div
      v-else
      class="w-full max-w-[1100px] grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
    >
      <!-- ── Brand panel ───────────────────── -->
      <aside class="flex flex-col gap-[0.85rem] py-4 items-center text-center md:items-start md:text-left">
        <div class="brand-badge">
          <i class="pi pi-leaf" />
        </div>

        <h1 class="text-[2.6rem] font-extrabold m-0 text-[#111827] tracking-tight leading-[1.1]">
          FreshFlow
        </h1>

        <p class="text-[1.05rem] font-semibold text-[#16a34a] m-0">
          Smart Grocery Assistant
        </p>

        <p class="text-[0.95rem] text-[#4b5563] m-0 leading-relaxed max-w-[380px]">
          Verwalte Lebensmittel, Einkaufsliste und Ablaufdaten.
        </p>

        <ul class="list-none mt-2 mb-1 p-0 flex flex-col gap-[0.7rem]">
          <li class="flex items-center gap-[0.65rem] text-[0.9rem] text-[#374151] font-medium">
            <i class="pi pi-check-circle text-base text-[#16a34a] shrink-0 w-[1.1rem] text-center" />
            <span>Lebensmittel im Blick behalten</span>
          </li>

          <li class="flex items-center gap-[0.65rem] text-[0.9rem] text-[#374151] font-medium">
            <i class="pi pi-shopping-cart text-base text-[#16a34a] shrink-0 w-[1.1rem] text-center" />
            <span>Einkaufsliste schneller planen</span>
          </li>

          <li class="flex items-center gap-[0.65rem] text-[0.9rem] text-[#374151] font-medium">
            <i class="pi pi-clock text-base text-[#16a34a] shrink-0 w-[1.1rem] text-center" />
            <span>Ablaufdaten rechtzeitig erkennen</span>
          </li>
        </ul>

        <p class="text-[0.78rem] text-[#9ca3af] mt-1 leading-relaxed max-w-[360px]">
          Hilft dir dabei, Lebensmittel bewusster zu nutzen und unnötige Einkäufe zu vermeiden.
        </p>
      </aside>

      <!-- ── Card column ────────────────────────────────── -->
      <div class="w-full">
        <!-- ═══ ACCESS MODE ═══ -->
        <Card v-if="mode === 'access'" class="access-card">
          <template #title>
            Willkommen
          </template>

          <template #subtitle>
            Wähle, wie du FreshFlow verwenden möchtest.
          </template>

          <template #content>
            <Message severity="info" :closable="false" class="mb-4">
              Der Zugang wird im Web-Prototyp simuliert. Es wird keine echte Authentifizierung durchgeführt.
            </Message>

            <div class="flex flex-col gap-3">
              <Button
                label="Anmelden"
                icon="pi pi-sign-in"
                class="w-full justify-center"
                type="button"
                @click="showLogin"
              />

              <Button
                label="Registrieren"
                icon="pi pi-user-plus"
                severity="secondary"
                outlined
                class="w-full justify-center"
                type="button"
                @click="showRegister"
              />

              <Divider align="center">
                <span class="text-[0.8rem] text-[#9ca3af] whitespace-nowrap">
                  oder
                </span>
              </Divider>

              <Button
                label="Als Gast fortfahren"
                icon="pi pi-user"
                severity="secondary"
                outlined
                class="w-full justify-center"
                type="button"
                @click="continueAsGuest"
              />
            </div>

            <Button
              label="Zurück zur Startseite"
              icon="pi pi-arrow-left"
              text
              class="mb-2 pl-0 mt-3"
              type="button"
              @click="showWelcome"
            />
          </template>
        </Card>

        <!-- ═══ LOGIN MODE ═══ -->
        <Card v-else-if="mode === 'login'" class="access-card">
          <template #title>
            Anmelden
          </template>

          <template #subtitle>
            Melde dich mit Demo-Zugangsdaten an.
          </template>

          <template #content>
            <Button
              label="Zurück"
              icon="pi pi-arrow-left"
              text
              class="mb-2 pl-0"
              type="button"
              @click="showAccess"
            />

            <Message severity="info" :closable="false" class="mb-4">
              Demo-Zugang: Es wird keine echte Authentifizierung durchgeführt.
            </Message>

            <div class="flex flex-col gap-[0.1rem] mb-4">
              <div class="form-field flex flex-col gap-[0.4rem] mb-[0.85rem]">
                <label for="login-email" class="text-sm font-medium text-[#374151]">
                  E-Mail
                </label>

                <InputText
                  id="login-email"
                  v-model="email"
                  type="email"
                  placeholder="demo@freshflow.local"
                  autocomplete="email"
                />
              </div>

              <div class="form-field flex flex-col gap-[0.4rem] mb-[0.85rem]">
                <label for="login-password" class="text-sm font-medium text-[#374151]">
                  Passwort
                </label>

                <Password
                  id="login-password"
                  v-model="password"
                  :feedback="false"
                  toggle-mask
                  placeholder="Passwort eingeben"
                  autocomplete="current-password"
                  @keyup.enter="login"
                />
              </div>
            </div>

            <Button
              label="Einloggen"
              icon="pi pi-sign-in"
              class="w-full justify-center"
              type="button"
              @click="login"
            />

            <Message v-if="loginSuccess" severity="success" :closable="false" class="mt-3">
              Login erfolgreich. Weiterleitung zum Dashboard...
            </Message>

            <Message v-if="loginError" severity="error" :closable="false" class="mt-3">
              Bitte E-Mail und Passwort eingeben.
            </Message>
<div class="flex flex-col gap-3 mt-2">
  <Divider align="center">
    <span class="text-[0.8rem] text-[#9ca3af] whitespace-nowrap">
      Passkey-Anmeldung
    </span>
  </Divider>

  <Message severity="info" :closable="false" class="mb-4">
    Diese Anmeldung nutzt WebAuthn beziehungsweise Passkeys im Browser.
    Die biometrische Prüfung erfolgt durch den Browser oder das Betriebssystem.
  </Message>

  <Message
    v-if="!webauthnSupported"
    severity="warn"
    :closable="false"
    class="mb-3"
  >
    WebAuthn wird in diesem Browser nicht unterstützt.
  </Message>

  <Button
    label="Mit Passkey anmelden"
    icon="pi pi-key"
    severity="secondary"
    outlined
    :loading="passkeyLoginLoading"
    :disabled="!webauthnSupported || passkeyLoginLoading"
    class="w-full justify-center"
    type="button"
    @click="handleLoginWithPasskey"
  />

  <Message v-if="passkeyLoginSuccess" severity="success" :closable="false" class="mt-3">
    {{ passkeyLoginSuccess }}
  </Message>

  <Message v-if="passkeyLoginError" severity="error" :closable="false" class="mt-3">
    {{ passkeyLoginError }}
  </Message>
</div>  
              
          </template>
        </Card>

        <!-- ═══ REGISTER MODE ═══ -->
        <Card v-else class="access-card">
          <template #title>
            Registrieren
          </template>

          <template #subtitle>
            Erstelle ein simuliertes Demo-Profil oder registriere einen Passkey.
          </template>

          <template #content>
            <Button
              label="Zurück"
              icon="pi pi-arrow-left"
              text
              class="mb-2 pl-0"
              type="button"
              @click="showAccess"
            />

            <Message severity="info" :closable="false" class="mb-4">
              Die klassische Registrierung wird nur simuliert. Für das WebAuthn-Szenario
              kann zusätzlich ein Passkey im Browser registriert werden.
            </Message>

            <div class="flex flex-col gap-[0.1rem] mb-4">
              <div class="form-field flex flex-col gap-[0.4rem] mb-[0.85rem]">
                <label for="reg-name" class="text-sm font-medium text-[#374151]">
                  Name
                </label>

                <InputText
                  id="reg-name"
                  v-model="registerName"
                  placeholder="Dein Name"
                  autocomplete="name"
                />
              </div>

              <div class="form-field flex flex-col gap-[0.4rem] mb-[0.85rem]">
                <label for="reg-email" class="text-sm font-medium text-[#374151]">
                  E-Mail
                </label>

                <InputText
                  id="reg-email"
                  v-model="registerEmail"
                  type="email"
                  placeholder="deine@email.de"
                  autocomplete="email"
                />
              </div>

              <div class="form-field flex flex-col gap-[0.4rem] mb-[0.85rem]">
                <label for="reg-password" class="text-sm font-medium text-[#374151]">
                  Passwort
                </label>

                <Password
                  id="reg-password"
                  v-model="registerPassword"
                  :feedback="false"
                  toggle-mask
                  placeholder="Passwort wählen"
                  autocomplete="new-password"
                />
              </div>
            </div>

            <Button
              label="Registrieren"
              icon="pi pi-user-plus"
              class="w-full justify-center"
              type="button"
              @click="register"
            />

            <Message v-if="registerSuccess" severity="success" :closable="false" class="mt-3">
              Registrierung erfolgreich. Weiterleitung zum Dashboard...
            </Message>

            <Message v-if="registerError" severity="error" :closable="false" class="mt-3">
              Bitte alle Felder ausfüllen.
            </Message>

            <Divider align="center">
              <span class="text-[0.8rem] text-[#9ca3af] whitespace-nowrap">
                oder mit Passkey
              </span>
            </Divider>

            <Message severity="info" :closable="false" class="mb-4">
              Diese Funktion prüft eine browserbasierte WebAuthn-Registrierung.
              Die biometrische Prüfung erfolgt durch den Browser beziehungsweise das Betriebssystem.
            </Message>

            <Message
              v-if="!webauthnSupported"
              severity="warn"
              :closable="false"
              class="mb-3"
            >
              WebAuthn wird in diesem Browser nicht unterstützt.
            </Message>

            <Message
              v-else-if="!platformAvailable"
              severity="warn"
              :closable="false"
              class="mb-3"
            >
              WebAuthn wird unterstützt, aber es wurde kein Plattform-Authenticator erkannt.
            </Message>

            <Message
              v-else
              severity="success"
              :closable="false"
              class="mb-3"
            >
              WebAuthn und ein Plattform-Authenticator sind verfügbar.
            </Message>

            <Button
              label="Passkey registrieren"
              icon="pi pi-key"
              severity="secondary"
              outlined
              :loading="passkeyLoading"
              :disabled="!webauthnSupported || passkeyLoading"
              class="w-full justify-center"
              type="button"
              @click="handleRegisterPasskey"
            />

            <Message v-if="passkeySuccess" severity="success" :closable="false" class="mt-3">
              {{ passkeySuccess }}
            </Message>

            <Message v-if="passkeyError" severity="error" :closable="false" class="mt-3">
              {{ passkeyError }}
            </Message>
          </template>
        </Card>
      </div>
    </div>
  </main>
</template>

<style scoped>
.access-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1.5rem;
  background: linear-gradient(135deg, #f0fdf4 0%, #f9fafb 55%, #ecfdf5 100%);
}

.brand-badge {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #16a34a, #4ade80);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(22, 163, 74, 0.3);
  margin-bottom: 0.25rem;
}

.brand-badge .pi {
  font-size: 1.7rem;
  color: #fff;
}

.access-card {
  width: 100%;
  border-radius: 16px !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1) !important;
  border: 1px solid #e5e7eb !important;
  overflow: hidden;
}

.form-field :deep(.p-inputtext),
.form-field :deep(.p-password),
.form-field :deep(.p-password .p-inputtext) {
  width: 100%;
}

@media (max-width: 760px) {
  .access-page {
    align-items: flex-start;
    padding: 1.5rem 1rem;
  }
}
</style>