<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Divider from 'primevue/divider'

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

function resetMessages(): void {
  loginSuccess.value = false
  loginError.value = false
  registerSuccess.value = false
  registerError.value = false
  biometricSuccess.value = false
  biometricError.value = false
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
      JSON.stringify({ email: email.value, name: 'Demo User', loginMethod: 'demo-login' }),
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

function continueAsGuest(): void {
  localStorage.setItem(
    'smart-grocery-demo-user',
    JSON.stringify({ email: 'guest@freshflow.local', name: 'Guest User', loginMethod: 'guest' }),
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
    <div v-if="mode === 'welcome'" class="flex flex-col items-center text-center gap-4 max-w-[500px] w-full py-8 px-6">
      <div class="brand-badge">
        <i class="pi pi-leaf" />
      </div>
      <h1 class="text-[3rem] font-extrabold m-0 text-[#111827] tracking-tight leading-[1.1]">FreshFlow</h1>
      <p class="text-[1.05rem] font-semibold text-[#16a34a] m-0">Smart Grocery Assistant</p>
      <p class="text-[1rem] text-[#4b5563] m-0 leading-relaxed max-w-[420px]">
        Organisiere deinen Vorrat, plane Einkäufe einfacher und behalte Ablaufdaten sowie Reste im Blick.
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
        iconPos="right"
        class="mt-2 px-9 py-3 text-[1.05rem] font-semibold"
        @click="showAccess"
      />
    </div>

    <!-- ═══ ACCESS / LOGIN / REGISTER ═══ -->
    <div v-else class="w-full max-w-[1100px] grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

      <!-- ── Brand panel (condensed) ───────────────────── -->
      <aside class="flex flex-col gap-[0.85rem] py-4 items-center text-center md:items-start md:text-left">
        <div class="brand-badge">
          <i class="pi pi-leaf" />
        </div>
        <h1 class="text-[2.6rem] font-extrabold m-0 text-[#111827] tracking-tight leading-[1.1]">FreshFlow</h1>
        <p class="text-[1.05rem] font-semibold text-[#16a34a] m-0">Smart Grocery Assistant</p>
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
          <template #title>Willkommen</template>
          <template #subtitle>Wähle, wie du FreshFlow verwenden möchtest.</template>
          <template #content>
            <Message severity="info" :closable="false" class="mb-4">
              Der Zugang wird im Web-Prototyp simuliert. Es wird keine echte Authentifizierung durchgeführt.
            </Message>
            <div class="flex flex-col gap-3">
              <Button
                label="Anmelden"
                icon="pi pi-sign-in"
                class="w-full justify-center"
                @click="showLogin"
              />
              <Button
                label="Registrieren"
                icon="pi pi-user-plus"
                severity="secondary"
                outlined
                class="w-full justify-center"
                @click="showRegister"
              />
              <Divider align="center"><span class="text-[0.8rem] text-[#9ca3af] whitespace-nowrap">oder</span></Divider>
              <Button
                label="Als Gast fortfahren"
                icon="pi pi-user"
                severity="secondary"
                outlined
                class="w-full justify-center"
                @click="continueAsGuest"
              />
            </div>
            <Button
              label="Zurück zur Startseite"
              icon="pi pi-arrow-left"
              text
              class="mb-2 pl-0 mt-3"
              @click="showWelcome"
            />
          </template>
        </Card>

        <!-- ═══ LOGIN MODE ═══ -->
        <Card v-else-if="mode === 'login'" class="access-card">
          <template #title>Anmelden</template>
          <template #subtitle>Melde dich mit Demo-Zugangsdaten an.</template>
          <template #content>
            <Button
              label="Zurück"
              icon="pi pi-arrow-left"
              text
              class="mb-2 pl-0"
              @click="showAccess"
            />
            <Message severity="info" :closable="false" class="mb-4">
              Demo-Zugang: Es wird keine echte Authentifizierung durchgeführt.
            </Message>
            <div class="flex flex-col gap-[0.1rem] mb-4">
              <div class="flex flex-col gap-[0.4rem] mb-[0.85rem]">
                <label for="login-email" class="text-sm font-medium text-[#374151]">E-Mail</label>
                <InputText
                  id="login-email"
                  v-model="email"
                  type="email"
                  placeholder="demo@freshflow.local"
                  autocomplete="email"
                />
              </div>
              <div class="flex flex-col gap-[0.4rem] mb-[0.85rem]">
                <label for="login-password" class="text-sm font-medium text-[#374151]">Passwort</label>
                <Password
                  id="login-password"
                  v-model="password"
                  :feedback="false"
                  toggleMask
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
                <span class="text-[0.8rem] text-[#9ca3af] whitespace-nowrap">Biometrische Anmeldung</span>
              </Divider>
              <Message severity="info" :closable="false" class="mb-4">
                Die Fingerabdruck-Anmeldung wird im Web-Prototyp nur simuliert. Eine echte
                biometrische Authentifizierung kann später in der Capacitor-Variante untersucht
                werden.
              </Message>
              <Button
                label="Mit Fingerabdruck anmelden"
                icon="pi pi-lock"
                severity="secondary"
                outlined
                :loading="biometricLoading"
                class="w-full justify-center"
                @click="loginWithFingerprint"
              />
              <Message v-if="biometricSuccess" severity="success" :closable="false" class="mt-3">
                Biometrische Anmeldung erfolgreich. Weiterleitung zum Dashboard...
              </Message>
              <Message v-if="biometricError" severity="error" :closable="false" class="mt-3">
                Biometrische Anmeldung konnte nicht durchgeführt werden.
              </Message>
            </div>
          </template>
        </Card>

        <!-- ═══ REGISTER MODE ═══ -->
        <Card v-else class="access-card">
          <template #title>Registrieren</template>
          <template #subtitle>Erstelle ein simuliertes Demo-Profil.</template>
          <template #content>
            <Button
              label="Zurück"
              icon="pi pi-arrow-left"
              text
              class="mb-2 pl-0"
              @click="showAccess"
            />
            <Message severity="info" :closable="false" class="mb-4">
              Die Registrierung wird nur simuliert. Es wird kein echtes Konto erstellt.
            </Message>
            <div class="flex flex-col gap-[0.1rem] mb-4">
              <div class="flex flex-col gap-[0.4rem] mb-[0.85rem]">
                <label for="reg-name" class="text-sm font-medium text-[#374151]">Name</label>
                <InputText
                  id="reg-name"
                  v-model="registerName"
                  placeholder="Dein Name"
                  autocomplete="name"
                />
              </div>
              <div class="flex flex-col gap-[0.4rem] mb-[0.85rem]">
                <label for="reg-email" class="text-sm font-medium text-[#374151]">E-Mail</label>
                <InputText
                  id="reg-email"
                  v-model="registerEmail"
                  type="email"
                  placeholder="deine@email.de"
                  autocomplete="email"
                />
              </div>
              <div class="flex flex-col gap-[0.4rem] mb-[0.85rem]">
                <label for="reg-password" class="text-sm font-medium text-[#374151]">Passwort</label>
                <Password
                  id="reg-password"
                  v-model="registerPassword"
                  :feedback="false"
                  toggleMask
                  placeholder="Passwort wählen"
                  autocomplete="new-password"
                />
              </div>
            </div>
            <Button
              label="Registrieren"
              icon="pi pi-user-plus"
              class="w-full justify-center"
              @click="register"
            />
            <Message v-if="registerSuccess" severity="success" :closable="false" class="mt-3">
              Registrierung erfolgreich. Weiterleitung zum Dashboard...
            </Message>
            <Message v-if="registerError" severity="error" :closable="false" class="mt-3">
              Bitte alle Felder ausfüllen.
            </Message>
          </template>
        </Card>

      </div>

    </div>
  </main>
</template>

<style scoped>
/* ── Page: gradient bg kept (complex multi-stop gradient) ── */
.access-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1.5rem;
  background: linear-gradient(135deg, #f0fdf4 0%, #f9fafb 55%, #ecfdf5 100%);
}

/* ── Brand badge: circular gradient kept ─────────────────── */
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

/* ── Access card: !important overrides for PrimeVue ─────── */
.access-card {
  width: 100%;
  border-radius: 16px !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1) !important;
  border: 1px solid #e5e7eb !important;
  overflow: hidden;
}

/* ── PrimeVue input width inside form fields ─────────────── */
.form-field :deep(.p-inputtext),
.form-field :deep(.p-password),
.form-field :deep(.p-password .p-inputtext) {
  width: 100%;
}

/* ── Responsive ──────────────────────────────────────────── */
@media (max-width: 760px) {
  .access-page {
    align-items: flex-start;
    padding: 1.5rem 1rem;
  }
}
</style>
