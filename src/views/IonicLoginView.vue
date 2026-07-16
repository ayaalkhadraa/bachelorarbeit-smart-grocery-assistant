<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Capacitor } from '@capacitor/core'
import { NativeBiometric } from '@capgo/capacitor-native-biometric'
import {
  IonAlert,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonIcon,
  IonInput,
  IonNote,
  IonToast,
} from '@ionic/vue'
import {
  arrowBackOutline,
  fingerPrintOutline,
  keyOutline,
  logInOutline,
  personOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons'

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

type ToastTone = 'success' | 'danger' | 'warning'

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

const comparisonAlertOpen = ref(true)
const feedbackToast = ref<{ message: string; color: ToastTone } | null>(null)

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

function showToast(message: string, color: ToastTone): void {
  feedbackToast.value = { message, color }
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
    showToast(biometricActivationError.value, 'danger')
    return
  }

  biometricActivationLoading.value = true

  try {
    const verified = await verifyNativeBiometric(
      'Bestätige die Aktivierung der biometrischen Anmeldung für dieses Gerät.',
    )

    if (!verified) {
      biometricActivationError.value = 'Biometrische Aktivierung wurde abgebrochen oder ist fehlgeschlagen.'
      showToast(biometricActivationError.value, 'danger')
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
    showToast(biometricActivationSuccess.value, 'success')
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
      showToast(biometricLoginError.value, 'danger')
      return
    }

    if (!biometricAvailable.value) {
      biometricLoginError.value = 'Biometrische Anmeldung ist auf diesem Gerät nicht verfügbar.'
      showToast(biometricLoginError.value, 'danger')
      return
    }

    if (!biometricEnabled.value) {
      biometricLoginError.value = 'Biometrische Anmeldung ist noch nicht aktiviert. Öffne die Einstellungen und aktiviere sie zuerst.'
      showToast(biometricLoginError.value, 'danger')
      return
    }

    if (!biometricProfile.value) {
      biometricLoginError.value = 'Bitte zuerst normal anmelden und Biometrie aktivieren.'
      showToast(biometricLoginError.value, 'danger')
      return
    }

    const verified = await verifyNativeBiometric('Bestätige die biometrische Anmeldung für FreshFlow.')

    if (!verified) {
      biometricLoginError.value = 'Biometrische Anmeldung wurde abgebrochen oder ist fehlgeschlagen.'
      showToast(biometricLoginError.value, 'danger')
      return
    }

    persistDemoUser({
      email: biometricProfile.value.email,
      name: biometricProfile.value.name,
      loginMethod: 'biometric-native',
    })

    biometricLoginSuccess.value = 'Biometrische Anmeldung erfolgreich. Weiterleitung zum Dashboard...'
    showToast(biometricLoginSuccess.value, 'success')
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
    showToast(passkeyError.value, 'danger')
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
      showToast(passkeySuccess.value, 'success')
      email.value = registerEmail.value
    } else {
      passkeyError.value = 'Passkey konnte nicht registriert werden.'
      showToast(passkeyError.value, 'danger')
    }
  } catch (error: unknown) {
    console.error('[WebAuthn] registration failed', error)

    passkeyError.value =
      error instanceof Error
        ? error.message
        : 'Fehler bei der Passkey-Registrierung.'
    showToast(passkeyError.value, 'danger')
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
    showToast(passkeyLoginError.value, 'danger')
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
      showToast(passkeyLoginSuccess.value, 'success')

      setTimeout(() => router.push('/'), 1000)
    } else {
      passkeyLoginError.value =
        'Passkey-Anmeldung konnte nicht verifiziert werden.'
      showToast(passkeyLoginError.value, 'danger')
    }
  } catch (error: unknown) {
    console.error('[WebAuthn] login failed', error)

    passkeyLoginError.value =
      error instanceof Error
        ? error.message
        : 'Fehler bei der Passkey-Anmeldung.'
    showToast(passkeyLoginError.value, 'danger')
  } finally {
    passkeyLoginLoading.value = false
  }
}

const loginButtonLabel = computed(() => 'Mit Passkey anmelden')

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

const loginCardSubtitle = computed(() => 'Smart Grocery Assistant')

const loginCardInfoMessage = computed(() => 'Melde dich schnell und sicher mit deinem Gerät an.')

const showAndroidBiometricWarning = computed(() => isAndroidNative.value && !biometricAvailable.value)

const showWebAuthnUnavailableMessage = computed(() => isWebPlatform.value && !webauthnSupported.value)

const showWebPlatformWarning = computed(() => isWebPlatform.value && webauthnSupported.value && !platformAvailable.value)

const showBiometricActivationPrompt = computed(
  () => isAndroidNative.value && Boolean(pendingLoginUser.value) && !biometricEnabled.value,
)
</script>

<template>
  <main class="fixed inset-0 z-[1200] flex items-start justify-center overflow-y-auto bg-[linear-gradient(135deg,#f0fdf4_0%,#f8fafc_56%,#ecfdf5_100%)] px-4 py-4 md:items-center md:px-6 md:py-6">
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="absolute -top-24 right-[-4rem] h-56 w-56 rounded-full bg-[#16a34a]/10 blur-3xl"></div>
      <div class="absolute bottom-[-5rem] left-[-3rem] h-64 w-64 rounded-full bg-[#22c55e]/10 blur-3xl"></div>
    </div>

    <section class="relative w-full max-w-[520px] pt-2 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pt-0 md:pb-0">
      <IonCard class="m-0 overflow-hidden shadow-[0_18px_50px_rgba(15,23,42,0.11)]">
        <IonCardHeader class="px-5 pt-5 pb-3">
          <div class="flex flex-col items-center gap-3 text-center md:items-start md:text-left">
            <div class="brand-badge">
              <i class="pi pi-leaf" />
            </div>

            <div class="min-w-0">
              <IonCardTitle class="text-[2.15rem] font-extrabold tracking-tight text-[#111827] leading-[1.05]">FreshFlow</IonCardTitle>
              <IonCardSubtitle class="mt-1 text-[0.98rem] font-semibold text-[#16a34a]">{{ loginCardSubtitle }}</IonCardSubtitle>
            </div>
          </div>
        </IonCardHeader>

        <IonCardContent class="px-5 pb-5 pt-0">
          <IonNote class="mb-4 block text-[0.92rem] leading-relaxed text-[#4b5563]">
            {{ loginCardInfoMessage }}
          </IonNote>

          <div v-if="mode === 'welcome'" class="flex flex-col gap-4">
            <IonButton expand="block" class="freshflow-primary" type="button" @click="showAccess">
              <IonIcon slot="start" :icon="logInOutline" />
              Loslegen
            </IonButton>

            <IonButton expand="block" fill="clear" color="success" type="button" @click="showAccess">
              <IonIcon slot="start" :icon="arrowBackOutline" />
              Direkt zur Anmeldung
            </IonButton>
          </div>

          <div v-else class="flex flex-col gap-4">
            <div v-if="mode === 'access'" class="flex flex-col gap-4">
              <IonButton expand="block" class="freshflow-primary" type="button" @click="showLogin">
                <IonIcon slot="start" :icon="isAndroidNative ? fingerPrintOutline : keyOutline" />
                {{ loginButtonLabel }}
              </IonButton>

              <IonButton
                v-if="!isAndroidNative"
                expand="block"
                fill="outline"
                color="success"
                type="button"
                @click="showRegister"
              >
                <IonIcon slot="start" :icon="keyOutline" />
                Passkey registrieren
              </IonButton>

              <div class="my-1 flex items-center gap-3 text-[#6b7280]">
                <div class="h-px flex-1 bg-[#d1fae5]"></div>
                <span class="text-[0.72rem] font-semibold uppercase tracking-[0.08em]">Testzugang</span>
                <div class="h-px flex-1 bg-[#d1fae5]"></div>
              </div>

              <IonButton expand="block" fill="clear" color="success" type="button" @click="continueAsGuest">
                <IonIcon slot="start" :icon="personOutline" />
                Als Gast fortfahren
              </IonButton>

              <IonButton expand="block" fill="clear" color="medium" type="button" @click="showWelcome">
                <IonIcon slot="start" :icon="arrowBackOutline" />
                Zurück zur Startseite
              </IonButton>
            </div>

            <div v-else-if="mode === 'login'" class="flex flex-col gap-4">
              <IonButton expand="block" fill="clear" color="success" class="justify-start px-0" type="button" @click="showAccess">
                <IonIcon slot="start" :icon="arrowBackOutline" />
                Zurück
              </IonButton>

              <IonNote v-if="showWebAuthnUnavailableMessage" class="block text-sm text-amber-700">
                WebAuthn wird in diesem Browser nicht unterstützt.
              </IonNote>

              <IonNote v-else-if="showWebPlatformWarning" class="block text-sm text-amber-700">
                WebAuthn wird unterstützt, aber es wurde kein Plattform-Authenticator erkannt.
              </IonNote>

              <IonNote v-if="isAndroidNative && !biometricProfile" class="block text-sm text-amber-700">
                Bitte zuerst normal anmelden und Biometrie aktivieren.
              </IonNote>

              <IonNote v-else-if="showAndroidBiometricWarning" class="block text-sm text-amber-700">
                Biometrische Anmeldung ist auf diesem Gerät aktuell nicht verfügbar.
              </IonNote>

              <div v-if="!isAndroidNative" class="flex flex-col gap-2">
                <IonInput
                  v-model="email"
                  label="E-Mail"
                  label-placement="stacked"
                  type="email"
                  placeholder="deine@email.de"
                  autocomplete="email"
                  fill="outline"
                />
              </div>

              <IonButton
                expand="block"
                class="freshflow-primary"
                type="button"
                :disabled="primaryLoginDisabled"
                :loading="primaryLoginLoading"
                @click="isAndroidNative ? handleBiometricLogin() : handleLoginWithPasskey()"
              >
                <IonIcon slot="start" :icon="isAndroidNative ? fingerPrintOutline : keyOutline" />
                Mit Passkey anmelden
              </IonButton>

              <IonNote v-if="primaryLoginSuccess" class="block text-sm text-emerald-700">
                {{ primaryLoginSuccess }}
              </IonNote>

              <IonNote v-if="primaryLoginError" class="block text-sm text-rose-700">
                {{ primaryLoginError }}
              </IonNote>

              <div
                v-if="showBiometricActivationPrompt"
                class="flex flex-col gap-3 rounded-2xl border border-[#d1fae5] bg-[#f0fdf4] p-4"
              >
                <div class="flex items-start gap-3">
                  <div class="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-[#16a34a]/10 text-[#16a34a]">
                    <IonIcon :icon="shieldCheckmarkOutline" class="text-[1.05rem]" />
                  </div>

                  <div class="min-w-0">
                    <p class="m-0 text-sm font-semibold text-[#111827]">Biometrische Anmeldung für dieses Gerät</p>
                    <p class="mt-1 m-0 text-sm leading-relaxed text-[#4b5563]">
                      Es wird nur ein lokaler Aktivierungsstatus gespeichert. Es werden keine Passwörter oder biometrischen Daten in der App abgelegt.
                    </p>
                  </div>
                </div>

                <IonButton expand="block" class="freshflow-primary" type="button" :loading="biometricActivationLoading" @click="handleEnableBiometricLogin">
                  <IonIcon slot="start" :icon="fingerPrintOutline" />
                  Biometrie aktivieren
                </IonButton>

                <IonNote v-if="biometricActivationSuccess" class="block text-sm text-emerald-700">
                  {{ biometricActivationSuccess }}
                </IonNote>

                <IonNote v-if="biometricActivationError" class="block text-sm text-rose-700">
                  {{ biometricActivationError }}
                </IonNote>
              </div>
            </div>

            <div v-else-if="!isAndroidNative" class="flex flex-col gap-4">
              <IonButton expand="block" fill="clear" color="success" class="justify-start px-0" type="button" @click="showAccess">
                <IonIcon slot="start" :icon="arrowBackOutline" />
                Zurück
              </IonButton>

              <IonNote v-if="!webauthnSupported" class="block text-sm text-amber-700">
                WebAuthn wird in diesem Browser nicht unterstützt.
              </IonNote>

              <IonNote v-else-if="!platformAvailable" class="block text-sm text-amber-700">
                WebAuthn wird unterstützt, aber es wurde kein Plattform-Authenticator erkannt.
              </IonNote>

              <IonNote v-else class="block text-sm text-emerald-700">
                WebAuthn und ein Plattform-Authenticator sind verfügbar.
              </IonNote>

              <IonInput
                v-model="registerName"
                label="Name"
                label-placement="stacked"
                placeholder="Dein Name"
                autocomplete="name"
                fill="outline"
              />

              <IonInput
                v-model="registerEmail"
                label="E-Mail"
                label-placement="stacked"
                type="email"
                placeholder="deine@email.de"
                autocomplete="email"
                fill="outline"
              />

              <IonButton
                expand="block"
                class="freshflow-primary"
                type="button"
                :disabled="!webauthnSupported || passkeyLoading"
                :loading="passkeyLoading"
                @click="handleRegisterPasskey"
              >
                <IonIcon slot="start" :icon="keyOutline" />
                Passkey registrieren
              </IonButton>

              <IonNote v-if="passkeySuccess" class="block text-sm text-emerald-700">
                {{ passkeySuccess }}
              </IonNote>

              <IonNote v-if="passkeyError" class="block text-sm text-rose-700">
                {{ passkeyError }}
              </IonNote>

              <IonButton
                v-if="passkeySuccess"
                expand="block"
                fill="outline"
                color="success"
                type="button"
                @click="showLogin"
              >
                <IonIcon slot="start" :icon="logInOutline" />
                Zur Anmeldung wechseln
              </IonButton>
            </div>

            <div v-else class="flex flex-col gap-4">
              <IonButton expand="block" class="freshflow-primary" type="button" @click="showLogin">
                <IonIcon slot="start" :icon="fingerPrintOutline" />
                Zur Anmeldung wechseln
              </IonButton>
            </div>
          </div>
        </IonCardContent>
      </IonCard>

      <IonToast
        :is-open="Boolean(feedbackToast)"
        :message="feedbackToast?.message ?? ''"
        :color="feedbackToast?.color ?? 'success'"
        duration="2200"
        position="bottom"
        @didDismiss="feedbackToast = null"
      />

      <IonAlert
        :is-open="comparisonAlertOpen"
        header="Vergleichsversion"
        sub-header="Temporäre Ionic-Anmeldung"
        message="Diese Seite verwendet dieselbe Authentifizierungslogik wie die Originalansicht und dient nur zum visuellen Vergleich."
        :buttons="['Verstanden']"
        @didDismiss="comparisonAlertOpen = false"
      />
    </section>
  </main>
</template>

<style scoped>
.freshflow-primary {
  --background: #16a34a;
  --background-hover: #15803d;
  --background-activated: #15803d;
  --color: #ffffff;
  --border-color: #16a34a;
  --box-shadow: 0 12px 24px rgba(22, 163, 74, 0.22);
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
  color: #ffffff;
}
</style>