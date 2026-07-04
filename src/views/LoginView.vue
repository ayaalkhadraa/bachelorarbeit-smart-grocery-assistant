<script setup lang="ts">
import { useRouter } from 'vue-router'
import { computed, ref, onMounted } from 'vue'
import { Capacitor } from '@capacitor/core'
import { NativeBiometric } from '@capgo/capacitor-native-biometric'

import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Divider from 'primevue/divider'

import {
  checkWebAuthnSupport,
  registerPasskey,
  loginWithPasskey,
} from '../services/webauthService'

const router = useRouter()

type DemoUser = {
  email: string
  name: string
  loginMethod?: string
}

const BIOMETRIC_STORAGE_KEY = 'smart-grocery-biometric-login'
const BIOMETRIC_ENABLED_KEY = 'smart-grocery-biometric-enabled'

const mode = ref<'welcome' | 'access' | 'login' | 'register'>('welcome')

const email = ref('')
const registerName = ref('')
const registerEmail = ref('')

const webauthnSupported = ref(false)
const platformAvailable = ref(false)
const isAndroidNative = computed(() => Capacitor.getPlatform() === 'android')
const isWebPlatform = computed(() => !isAndroidNative.value)

const biometricAvailable = ref(false)
const biometricProfile = ref<DemoUser | null>(null)
const biometricEnabled = ref(false)
const pendingLoginUser = ref<DemoUser | null>(null)

const biometricLoginLoading = ref(false)
const biometricLoginSuccess = ref('')
const biometricLoginError = ref('')

const biometricActivationLoading = ref(false)
const biometricActivationSuccess = ref('')
const biometricActivationError = ref('')

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
  } catch (error) {
    console.error('[WebAuthn] support check failed', error)
    webauthnSupported.value = false
    platformAvailable.value = false
  }

  loadBiometricProfile()
  loadBiometricActivationState()
  await syncBiometricAvailability()
})

function resetMessages(): void {
  passkeySuccess.value = ''
  passkeyError.value = ''
  passkeyLoginSuccess.value = ''
  passkeyLoginError.value = ''
  biometricLoginSuccess.value = ''
  biometricLoginError.value = ''
  biometricActivationSuccess.value = ''
  biometricActivationError.value = ''
  pendingLoginUser.value = null
}

function loadBiometricProfile(): void {
  try {
    const raw = localStorage.getItem(BIOMETRIC_STORAGE_KEY)

    if (!raw) {
      biometricProfile.value = null
      return
    }

    const parsed = JSON.parse(raw) as Partial<DemoUser>

    if (typeof parsed.email !== 'string' || typeof parsed.name !== 'string') {
      biometricProfile.value = null
      return
    }

    biometricProfile.value = {
      email: parsed.email,
      name: parsed.name,
      loginMethod: typeof parsed.loginMethod === 'string' ? parsed.loginMethod : undefined,
    }
  } catch {
    biometricProfile.value = null
  }
}

function loadBiometricActivationState(): void {
  try {
    biometricEnabled.value = localStorage.getItem(BIOMETRIC_ENABLED_KEY) === 'true'
  } catch {
    biometricEnabled.value = false
  }
}

function saveBiometricProfile(profile: DemoUser): void {
  localStorage.setItem(BIOMETRIC_STORAGE_KEY, JSON.stringify(profile))
  biometricProfile.value = profile
}

async function syncBiometricAvailability(): Promise<void> {
  if (!isAndroidNative.value) {
    biometricAvailable.value = false
    return
  }

  try {
    const result = await NativeBiometric.isAvailable()
    biometricAvailable.value = result.isAvailable
  } catch (error) {
    console.error('[Biometric] availability check failed', error)
    biometricAvailable.value = false
  }
}

async function verifyNativeBiometric(reason: string): Promise<boolean> {
  if (!isAndroidNative.value || !biometricAvailable.value) {
    return false
  }

  try {
    await NativeBiometric.verifyIdentity({
      reason,
      title: 'FreshFlow',
      subtitle: 'Biometrische Anmeldung',
      description: 'Bestätige die Anmeldung mit Fingerabdruck, Gesicht oder Gerätecode.',
    })

    return true
  } catch (error) {
    console.error('[Biometric] verification failed', error)
    return false
  }
}

function persistDemoUser(user: DemoUser): void {
  localStorage.setItem('smart-grocery-demo-user', JSON.stringify(user))
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

function continueAsGuest(): void {
  persistDemoUser({
    email: 'guest@freshflow.local',
    name: 'Guest User',
    loginMethod: 'guest',
  })

  router.push('/')
}

async function handleEnableBiometricLogin(): Promise<void> {
  biometricActivationSuccess.value = ''
  biometricActivationError.value = ''

  if (!pendingLoginUser.value) {
    biometricActivationError.value = 'Für die Aktivierung ist zuerst ein erfolgreicher Login erforderlich.'
    return
  }

  biometricActivationLoading.value = true

  try {
    const verified = await verifyNativeBiometric(
      'Bestätige die Aktivierung der biometrischen Anmeldung für dieses Gerät.',
    )

    if (!verified) {
      biometricActivationError.value = 'Biometrische Aktivierung wurde abgebrochen oder ist fehlgeschlagen.'
      return
    }

    const biometricUser = {
      email: pendingLoginUser.value.email,
      name: pendingLoginUser.value.name,
      loginMethod: pendingLoginUser.value.loginMethod,
    }

    saveBiometricProfile(biometricUser)
    persistDemoUser({
      email: biometricUser.email,
      name: biometricUser.name,
      loginMethod: 'biometric-native',
    })
    biometricActivationSuccess.value = 'Biometrische Anmeldung wurde für dieses Gerät aktiviert.'
    setTimeout(() => router.push('/'), 1000)
  } finally {
    biometricActivationLoading.value = false
  }
}

async function handleBiometricLogin(): Promise<void> {
  biometricLoginSuccess.value = ''
  biometricLoginError.value = ''
  biometricLoginLoading.value = true

  try {
    if (!isAndroidNative.value) {
      biometricLoginError.value = 'Die native biometrische Anmeldung ist nur auf Android verfügbar.'
      return
    }

    if (!biometricAvailable.value) {
      biometricLoginError.value = 'Biometrische Anmeldung ist auf diesem Gerät nicht verfügbar.'
      return
    }

    if (!biometricEnabled.value) {
      biometricLoginError.value = 'Biometrische Anmeldung ist noch nicht aktiviert. Öffne die Einstellungen und aktiviere sie zuerst.'
      return
    }

    if (!biometricProfile.value) {
      biometricLoginError.value = 'Bitte zuerst normal anmelden und Biometrie aktivieren.'
      return
    }

    const verified = await verifyNativeBiometric('Bestätige die biometrische Anmeldung für FreshFlow.')

    if (!verified) {
      biometricLoginError.value = 'Biometrische Anmeldung wurde abgebrochen oder ist fehlgeschlagen.'
      return
    }

    persistDemoUser({
      email: biometricProfile.value.email,
      name: biometricProfile.value.name,
      loginMethod: 'biometric-native',
    })

    biometricLoginSuccess.value = 'Biometrische Anmeldung erfolgreich. Weiterleitung zum Dashboard...'
    setTimeout(() => router.push('/'), 1000)
  } finally {
    biometricLoginLoading.value = false
  }
}

async function handleRegisterPasskey(): Promise<void> {
  passkeySuccess.value = ''
  passkeyError.value = ''

  if (!registerEmail.value) {
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
      email.value = registerEmail.value
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
    passkeyLoginError.value =
      'Bitte geben Sie die E-Mail-Adresse ein, mit der der Passkey registriert wurde.'
    return
  }

  try {
    passkeyLoginLoading.value = true

    console.log('[WebAuthn] login started', {
      email: email.value,
    })

    const result = await loginWithPasskey(email.value)

    console.log('[WebAuthn] login finished', result)

    if (result.verified && result.user) {
      const authenticatedUser = {
        email: result.user.email,
        name: result.user.name || 'Passkey User',
        loginMethod: 'webauthn-passkey',
      }

      persistDemoUser(authenticatedUser)
      passkeyLoginSuccess.value =
        'Passkey-Anmeldung erfolgreich. Weiterleitung zum Dashboard...'

      setTimeout(() => router.push('/'), 1000)
    } else {
      passkeyLoginError.value =
        'Passkey-Anmeldung konnte nicht verifiziert werden.'
    }
  } catch (error: unknown) {
    console.error('[WebAuthn] login failed', error)

    passkeyLoginError.value =
      error instanceof Error
        ? error.message
        : 'Fehler bei der Passkey-Anmeldung.'
  } finally {
    passkeyLoginLoading.value = false
  }
}

const loginButtonLabel = computed(() => (isAndroidNative.value ? 'Mit Biometrie anmelden' : 'Mit Passkey anmelden'))

const primaryLoginLoading = computed(() =>
  isAndroidNative.value ? biometricLoginLoading.value : passkeyLoginLoading.value,
)

const primaryLoginDisabled = computed(() =>
  isAndroidNative.value
    ? biometricLoginLoading.value || !biometricAvailable.value || !biometricEnabled.value || !biometricProfile.value
    : !webauthnSupported.value || passkeyLoginLoading.value,
)

const primaryLoginSuccess = computed(() =>
  isAndroidNative.value ? biometricLoginSuccess.value : passkeyLoginSuccess.value,
)

const primaryLoginError = computed(() =>
  isAndroidNative.value ? biometricLoginError.value : passkeyLoginError.value,
)

const loginCardTitle = computed(() => (isAndroidNative.value ? 'Biometrische Anmeldung' : 'Passkey-Anmeldung'))

const loginCardSubtitle = computed(() =>
  isAndroidNative.value
    ? 'Melde dich mit dem nativen Android-Biometrie-Dialog an.'
    : 'Melde dich mit einem bereits registrierten Passkey an.',
)

const loginCardInfoMessage = computed(() =>
  isAndroidNative.value
    ? 'Die Anmeldung verwendet den nativen Android-Biometrie-Dialog. Es werden keine Passwörter oder biometrischen Daten serverseitig gespeichert.'
    : 'Die Anmeldung nutzt WebAuthn beziehungsweise Passkeys im Browser. Je nach Gerät kann die Bestätigung über Windows Hello, PIN, Fingerabdruck, Gesichtserkennung oder Gerätecode erfolgen.',
)

const accessCardInfoMessage = computed(() =>
  isAndroidNative.value
    ? 'Die Anmeldung auf Android verwendet die native biometrische Authentifizierung des Geräts. Es werden keine Passkeys im Browser registriert.'
    : 'In diesem Prototyp wird eine Anmeldung über WebAuthn beziehungsweise Passkeys untersucht. Die eigentliche Bestätigung erfolgt durch den Browser oder das Betriebssystem.',
)

const showAndroidBiometricWarning = computed(() => isAndroidNative.value && !biometricAvailable.value)

const showAndroidBiometricProfileMissing = computed(
  () => isAndroidNative.value && biometricEnabled.value && !biometricProfile.value,
)

const showWebAuthnUnavailableMessage = computed(() => isWebPlatform.value && !webauthnSupported.value)

const showWebPlatformWarning = computed(() => isWebPlatform.value && webauthnSupported.value && !platformAvailable.value)

const showBiometricActivationPrompt = computed(
  () => isAndroidNative.value && Boolean(pendingLoginUser.value) && !biometricEnabled.value,
)
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
            {{ isAndroidNative ? 'Die Anmeldung nutzt auf Android die native biometrische Authentifizierung des Geräts.' : 'Die Anmeldung dient in diesem Prototyp der Untersuchung einer browserbasierten Passkey-Authentifizierung.' }}
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
              {{ accessCardInfoMessage }}
            </Message>

            <div class="flex flex-col gap-3">
              <Button
                :label="loginButtonLabel"
                :icon="isAndroidNative ? 'pi pi-shield' : 'pi pi-key'"
                class="w-full justify-center"
                type="button"
                @click="showLogin"
              />

              <Button
                v-if="!isAndroidNative"
                label="Passkey registrieren"
                icon="pi pi-user-plus"
                severity="secondary"
                outlined
                class="w-full justify-center"
                type="button"
                @click="showRegister"
              />

              <Divider align="center">
                <span class="text-[0.8rem] text-[#9ca3af] whitespace-nowrap">
                  Testzugang
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
            {{ loginCardTitle }}
          </template>

          <template #subtitle>
            {{ loginCardSubtitle }}
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
              {{ loginCardInfoMessage }}
            </Message>

            <Message
              v-if="showWebAuthnUnavailableMessage"
              severity="warn"
              :closable="false"
              class="mb-3"
            >
              WebAuthn wird in diesem Browser nicht unterstützt.
            </Message>

            <Message
              v-else-if="showWebPlatformWarning"
              severity="warn"
              :closable="false"
              class="mb-3"
            >
              WebAuthn wird unterstützt, aber es wurde kein Plattform-Authenticator
              erkannt. Je nach Gerät kann die Anmeldung dennoch eingeschränkt möglich sein.
            </Message>

            <Message
              v-if="isAndroidNative && !biometricProfile"
              severity="warn"
              :closable="false"
              class="mb-3"
            >
              Bitte zuerst normal anmelden und Biometrie aktivieren.
            </Message>

            <Message
              v-else-if="showAndroidBiometricWarning"
              severity="warn"
              :closable="false"
              class="mb-3"
            >
              Biometrische Anmeldung ist auf diesem Gerät aktuell nicht verfügbar.
            </Message>

            <div v-if="!isAndroidNative" class="form-field flex flex-col gap-[0.4rem] mb-[0.85rem]">
              <label for="login-email" class="text-sm font-medium text-[#374151]">
                E-Mail
              </label>

              <InputText
                id="login-email"
                v-model="email"
                type="email"
                placeholder="deine@email.de"
                autocomplete="email"
              />
            </div>

            <Button
              :label="loginButtonLabel"
              :icon="isAndroidNative ? 'pi pi-shield' : 'pi pi-key'"
              :loading="primaryLoginLoading"
              :disabled="primaryLoginDisabled"
              class="w-full justify-center"
              type="button"
              @click="isAndroidNative ? handleBiometricLogin() : handleLoginWithPasskey()"
            />

            <Message
              v-if="primaryLoginSuccess"
              severity="success"
              :closable="false"
              class="mt-3"
            >
              {{ primaryLoginSuccess }}
            </Message>

            <Message
              v-if="primaryLoginError"
              severity="error"
              :closable="false"
              class="mt-3"
            >
              {{ primaryLoginError }}
            </Message>

            <div
              v-if="showBiometricActivationPrompt"
              class="mt-4 rounded-[var(--sg-radius-md)] border border-[var(--sg-border)] bg-[var(--sg-primary-soft)]/30 p-4 flex flex-col gap-3"
            >
              <div>
                <p class="text-sm font-semibold text-[#111827] m-0">
                  Biometrische Anmeldung für dieses Gerät
                </p>

                <p class="text-sm text-[#4b5563] m-0 mt-1 leading-relaxed">
                  Es wird nur ein lokaler Aktivierungsstatus gespeichert. Es werden keine
                  Passwörter oder biometrischen Daten in der App abgelegt.
                </p>
              </div>

              <Button
                label="Biometrie aktivieren"
                icon="pi pi-shield"
                :loading="biometricActivationLoading"
                class="w-full justify-center"
                type="button"
                @click="handleEnableBiometricLogin"
              />

              <Message
                v-if="biometricActivationSuccess"
                severity="success"
                :closable="false"
              >
                {{ biometricActivationSuccess }}
              </Message>

              <Message
                v-if="biometricActivationError"
                severity="error"
                :closable="false"
              >
                {{ biometricActivationError }}
              </Message>
            </div>
          </template>
        </Card>

        <!-- ═══ REGISTER MODE ═══ -->
        <Card v-else-if="!isAndroidNative" class="access-card">
          <template #title>
            Passkey registrieren
          </template>

          <template #subtitle>
            Erstelle einen Passkey für die Anmeldung im Web-Prototyp.
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
              Die Anwendung speichert keine biometrischen Daten. Die Verifikation
              wird durch den Browser beziehungsweise das Betriebssystem durchgeführt.
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
              WebAuthn wird unterstützt, aber es wurde kein Plattform-Authenticator
              erkannt. Für den Test kann auch ein Virtual Authenticator verwendet werden.
            </Message>

            <Message
              v-else
              severity="success"
              :closable="false"
              class="mb-3"
            >
              WebAuthn und ein Plattform-Authenticator sind verfügbar.
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
            </div>

            <Button
              label="Passkey registrieren"
              icon="pi pi-key"
              :loading="passkeyLoading"
              :disabled="!webauthnSupported || passkeyLoading"
              class="w-full justify-center"
              type="button"
              @click="handleRegisterPasskey"
            />

            <Message
              v-if="passkeySuccess"
              severity="success"
              :closable="false"
              class="mt-3"
            >
              {{ passkeySuccess }}
            </Message>

            <Message
              v-if="passkeyError"
              severity="error"
              :closable="false"
              class="mt-3"
            >
              {{ passkeyError }}
            </Message>

            <Button
              v-if="passkeySuccess"
              label="Zur Anmeldung wechseln"
              icon="pi pi-sign-in"
              severity="secondary"
              outlined
              class="w-full justify-center mt-3"
              type="button"
              @click="showLogin"
            />
          </template>
        </Card>

        <Card v-else class="access-card">
          <template #title>
            Diese Funktion ist auf Android deaktiviert
          </template>

          <template #subtitle>
            Die Android-App nutzt den nativen Biometrie-Login und keine Passkey-Registrierung.
          </template>

          <template #content>
            <Message severity="info" :closable="false" class="mb-4">
              Auf Android wird nur der biometrische Anmeldeweg verwendet. Eine separate
              Passkey-Registrierung ist nicht vorgesehen.
            </Message>

            <Button
              label="Zur Anmeldung wechseln"
              icon="pi pi-shield"
              class="w-full justify-center"
              type="button"
              @click="showLogin"
            />
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

.form-field :deep(.p-inputtext) {
  width: 100%;
}

@media (max-width: 760px) {
  .access-page {
    align-items: flex-start;
    padding: 1.5rem 1rem;
  }
}
</style>