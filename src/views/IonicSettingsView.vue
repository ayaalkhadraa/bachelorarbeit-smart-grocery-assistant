<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Capacitor } from '@capacitor/core'
import { Geolocation } from '@capacitor/geolocation'
import { NativeBiometric } from '@capgo/capacitor-native-biometric'
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonChip,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonSelect,
  IonSelectOption,
  IonToggle,
  IonPage,
} from '@ionic/vue'
import {
  languageOutline,
  locationOutline,
  notificationsOutline,
  personOutline,
  saveOutline,
  sendOutline,
  shieldCheckmarkOutline,
  trashOutline,
} from 'ionicons/icons'

import { useGroceryStore } from '@/stores/groceryStore'
import {
  registerServiceWorker,
  requestNotificationPermission,
  showTestNotification,
  notifyExpiringProducts,
  type ExpiryCheckResult,
} from '@/services/notificationService'

const groceryStore = useGroceryStore()

onMounted(() => {
  groceryStore.loadItems()
  loadBiometricSettings()
  void syncBiometricAvailability()
  void syncNotificationState()
})

const isAndroidNative = computed(() => Capacitor.getPlatform() === 'android')

type DemoUser = {
  email: string
  name: string
  loginMethod?: string
}

const username = ref('Demo User')
const language = ref('Deutsch')
const notificationsEnabled = ref(true)
const darkModeSimulation = ref(false)
const resetMessageVisible = ref(false)

const notificationStatus = ref<'idle' | 'loading' | 'granted' | 'denied' | 'unsupported' | 'insecure' | 'error'>('idle')
const notificationError = ref('')
const notificationLoading = ref(false)
const notificationProductLoading = ref(false)
const notificationProductResult = ref<ExpiryCheckResult>({ soonExpiring: [], alreadyExpired: [] })
const notificationProductChecked = ref(false)
const notificationProductError = ref('')

const biometricEnabled = ref(false)
const biometricAvailable = ref(false)
const biometricActivationLoading = ref(false)
const biometricActivationSuccess = ref('')
const biometricActivationError = ref('')

const locationEnabled = ref(false)
const locationLoading = ref(false)
const locationError = ref('')

const SETTINGS_KEY = 'smart-grocery-settings'
const BIOMETRIC_ENABLED_KEY = 'smart-grocery-biometric-enabled'
const BIOMETRIC_STORAGE_KEY = 'smart-grocery-biometric-login'

const languages = ['Deutsch', 'Englisch', 'Arabisch']

const isNotificationEnabled = computed(() => notificationStatus.value === 'granted')
const isNotificationSecure = computed(() => typeof window !== 'undefined' && window.isSecureContext)
const hasNotificationAPI = computed(() => typeof window !== 'undefined' && 'Notification' in window)
const hasServiceWorker = computed(() => typeof navigator !== 'undefined' && 'serviceWorker' in navigator)
const isNotificationSupported = computed(() => hasNotificationAPI.value && hasServiceWorker.value)

function loadBiometricSettings(): void {
  try {
    biometricEnabled.value = localStorage.getItem(BIOMETRIC_ENABLED_KEY) === 'true'
  } catch {
    biometricEnabled.value = false
  }
}

function saveBiometricSettings(enabled: boolean): void {
  localStorage.setItem(BIOMETRIC_ENABLED_KEY, String(enabled))
  biometricEnabled.value = enabled
}

function deactivateBiometricLogin(): void {
  localStorage.removeItem(BIOMETRIC_ENABLED_KEY)
  biometricEnabled.value = false
  biometricActivationSuccess.value = 'Biometrische Anmeldung wurde auf diesem Gerät deaktiviert.'
  biometricActivationError.value = ''
}

function loadCurrentUserContext(): DemoUser | null {
  try {
    const raw = localStorage.getItem('smart-grocery-demo-user')

    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as Partial<DemoUser>

    if (typeof parsed.email !== 'string' || typeof parsed.name !== 'string') {
      return null
    }

    return {
      email: parsed.email,
      name: parsed.name,
      loginMethod: typeof parsed.loginMethod === 'string' ? parsed.loginMethod : undefined,
    }
  } catch {
    return null
  }
}

function saveBiometricProfile(profile: DemoUser): void {
  localStorage.setItem(BIOMETRIC_STORAGE_KEY, JSON.stringify(profile))
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
    biometricAvailable.value = false
  }
}

async function activateBiometricLogin(): Promise<void> {
  biometricActivationSuccess.value = ''
  biometricActivationError.value = ''

  if (!isAndroidNative.value) {
    biometricActivationError.value = 'Die Biometrie-Aktivierung ist nur in der Android-App verfügbar.'
    biometricEnabled.value = false
    return
  }

  biometricActivationLoading.value = true

  try {
    await syncBiometricAvailability()

    if (!biometricAvailable.value) {
      biometricActivationError.value = 'Biometrische Anmeldung ist auf diesem Gerät nicht verfügbar.'
      biometricEnabled.value = false
      return
    }

    const available = await NativeBiometric.isAvailable()

    if (!available.isAvailable) {
      biometricActivationError.value = 'Biometrische Anmeldung ist auf diesem Gerät nicht verfügbar.'
      biometricEnabled.value = false
      return
    }

    await NativeBiometric.verifyIdentity({
      reason: 'Bestätige die Aktivierung der biometrischen Anmeldung für FreshFlow.',
      title: 'FreshFlow',
      subtitle: 'Biometrische Anmeldung aktivieren',
      description: 'Bestätige die Aktivierung mit Fingerabdruck, Gesicht oder Gerätecode.',
    })

    const currentUser = loadCurrentUserContext()

    if (!currentUser) {
      biometricActivationError.value = 'Bitte zuerst normal anmelden und Biometrie aktivieren.'
      biometricEnabled.value = false
      return
    }

    saveBiometricProfile(currentUser)
    saveBiometricSettings(true)
    biometricActivationSuccess.value = 'Biometrische Anmeldung wurde auf diesem Gerät aktiviert.'
  } catch (error) {
    console.error('[IonicSettingsView] biometric activation failed', error)
    biometricEnabled.value = false
    biometricActivationError.value =
      error instanceof Error
        ? error.message
        : 'Biometrische Anmeldung konnte nicht aktiviert werden.'
  } finally {
    biometricActivationLoading.value = false
  }
}

async function handleBiometricToggle(enabled: boolean): Promise<void> {
  biometricEnabled.value = enabled

  if (enabled) {
    await activateBiometricLogin()
    return
  }

  deactivateBiometricLogin()
}

function getLocationErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Standort-Zugriff wurde abgelehnt. Bitte erlaube den Standort-Zugriff in den Browser-Einstellungen.'
    case error.POSITION_UNAVAILABLE:
      return 'Standort konnte nicht ermittelt werden.'
    case error.TIMEOUT:
      return 'Standort-Anfrage hat zu lange gedauert.'
    default:
      return 'Unbekannter Fehler bei der Standortbestimmung.'
  }
}

function getNativeLocationError(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error ? (error as { code?: string }).code : undefined

  switch (code) {
    case 'OS-PLUG-GLOC-0003':
      return 'Standort-Zugriff wurde abgelehnt. Bitte erlaube den Standort-Zugriff in den Android-App-Berechtigungen.'
    case 'OS-PLUG-GLOC-0007':
      return 'Standortdienste sind auf dem Gerät deaktiviert.'
    case 'OS-PLUG-GLOC-0009':
      return 'Standortfreigabe wurde vom Gerät abgelehnt.'
    case 'OS-PLUG-GLOC-0010':
      return 'Standort-Anfrage hat zu lange gedauert.'
    default:
      return 'Unbekannter Fehler bei der Standortbestimmung.'
  }
}

async function requestLocation(): Promise<void> {
  locationError.value = ''
  locationLoading.value = true

  try {
    if (Capacitor.isNativePlatform()) {
      await Geolocation.requestPermissions()
      await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      })
      locationEnabled.value = true
      return
    }

    if (!('geolocation' in navigator)) {
      locationError.value = 'Dein Browser unterstützt keine Standortbestimmung.'
      return
    }

    const isSecure = location.protocol === 'https:' || location.hostname === 'localhost'
    if (!isSecure) {
      locationError.value = 'Standortbestimmung erfordert HTTPS oder localhost. Bitte öffne die App über https:// oder localhost.'
      return
    }

    await new Promise<void>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve(),
        reject,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      )
    })

    locationEnabled.value = true
  } catch (error) {
    locationEnabled.value = false

    if (Capacitor.isNativePlatform()) {
      locationError.value = getNativeLocationError(error)
    } else if (typeof error === 'object' && error !== null && 'code' in error) {
      locationError.value = getLocationErrorMessage(error as GeolocationPositionError)
    } else {
      locationError.value = 'Unbekannter Fehler bei der Standortbestimmung.'
    }
  } finally {
    locationLoading.value = false
  }
}

async function handleLocationToggle(enabled: boolean): Promise<void> {
  if (enabled) {
    await requestLocation()
    return
  }

  resetLocation()
}

function resetLocation(): void {
  locationEnabled.value = false
  locationError.value = ''
}

async function syncNotificationState(): Promise<void> {
  if (!isNotificationSecure.value) {
    notificationStatus.value = 'insecure'
    return
  }

  if (!isNotificationSupported.value) {
    notificationStatus.value = 'unsupported'
    return
  }

  if (Notification.permission === 'granted') {
    notificationStatus.value = 'granted'
    await registerServiceWorker().catch(() => {
      // Silent fallback: a missing service worker should not break the settings screen.
    })
    return
  }

  if (Notification.permission === 'denied') {
    notificationStatus.value = 'denied'
    notificationError.value =
      'Benachrichtigungen wurden im Browser blockiert. Bitte erlaube sie in den Browser-Einstellungen und lade die Seite neu.'
  }
}

async function activateNotifications(): Promise<void> {
  if (!isNotificationSecure.value) {
    notificationStatus.value = 'insecure'
    return
  }
  if (!isNotificationSupported.value) {
    notificationStatus.value = 'unsupported'
    return
  }

  notificationLoading.value = true
  notificationError.value = ''
  notificationStatus.value = 'loading'

  try {
    await registerServiceWorker()

    const permission = await requestNotificationPermission()

    if (permission === 'denied') {
      notificationStatus.value = 'denied'
      notificationError.value =
        'Berechtigung abgelehnt. Bitte erlaube Benachrichtigungen in den Browser-Einstellungen und lade die Seite neu.'
      return
    }

    if (permission !== 'granted') {
      notificationStatus.value = 'idle'
      return
    }

    notificationStatus.value = 'granted'
  } catch (error) {
    notificationStatus.value = 'error'
    notificationError.value =
      error instanceof Error ? error.message : 'Unbekannter Fehler beim Aktivieren der Benachrichtigungen.'
  } finally {
    notificationLoading.value = false
  }
}

function deactivateNotifications(): void {
  notificationStatus.value = 'idle'
  notificationError.value = ''
  notificationProductChecked.value = false
  notificationProductError.value = ''
  notificationProductResult.value = { soonExpiring: [], alreadyExpired: [] }
}

async function handleNotificationToggle(enabled: boolean): Promise<void> {
  notificationsEnabled.value = enabled

  if (enabled) {
    await activateNotifications()
    return
  }

  deactivateNotifications()
}

function sendTestNotification(): void {
  showTestNotification()
}

function checkExpiringProducts(): void {
  notificationProductLoading.value = true
  notificationProductChecked.value = false
  notificationProductError.value = ''
  notificationProductResult.value = { soonExpiring: [], alreadyExpired: [] }

  try {
    notificationProductResult.value = notifyExpiringProducts(groceryStore.items)
    notificationProductChecked.value = true
  } catch (error) {
    notificationProductError.value =
      error instanceof Error ? error.message : 'Fehler beim Prüfen der Produkte.'
  } finally {
    notificationProductLoading.value = false
  }
}

function saveSettings(): void {
  const settings = {
    username: username.value,
    language: language.value,
    notificationsEnabled: notificationsEnabled.value,
    darkModeSimulation: darkModeSimulation.value,
  }
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  resetMessageVisible.value = false
}

function resetPrototypeData(): void {
  localStorage.removeItem('smart-grocery-items')
  localStorage.removeItem(SETTINGS_KEY)
  localStorage.removeItem(BIOMETRIC_ENABLED_KEY)
  localStorage.removeItem(BIOMETRIC_STORAGE_KEY)
  groceryStore.loadItems()
  biometricEnabled.value = false
  biometricActivationSuccess.value = ''
  biometricActivationError.value = ''
  resetMessageVisible.value = true
}
</script>

<template>
  <IonPage>
    <IonContent :fullscreen="true">
      <main class="w-full px-4 pb-[calc(9rem+env(safe-area-inset-bottom))] pt-4">
    <section class="mb-4">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h1 class="m-0 text-3xl font-bold tracking-tight text-color">Einstellungen</h1>
          <p class="m-0 mt-1 text-sm text-muted-color">
          </p>
        </div>

        <IonChip color="success" class="m-0 shrink-0">
        </IonChip>
      </div>
    </section>

    <div class="space-y-4">
      <IonCard class="m-0 settings-card">
        <IonCardHeader class="px-4 pt-4 pb-2">
          <IonCardTitle class="text-lg">Profil</IonCardTitle>
          <IonCardSubtitle>Benutzername und Sprache für die Prototyp-Ansicht.</IonCardSubtitle>
        </IonCardHeader>
        <IonCardContent class="px-4 pt-0 pb-4">
          <IonList lines="full" class="bg-transparent p-0">
            <IonItem class="settings-item">
              <IonIcon :icon="personOutline" slot="start" class="settings-icon" />
              <IonLabel position="stacked">Benutzername</IonLabel>
              <IonInput v-model="username" placeholder="Benutzername eingeben" />
            </IonItem>

            <IonItem class="settings-item">
              <IonIcon :icon="languageOutline" slot="start" class="settings-icon" />
              <IonLabel position="stacked">Sprache</IonLabel>
              <IonSelect v-model="language" interface="popover" placeholder="Sprache wählen">
                <IonSelectOption v-for="item in languages" :key="item" :value="item">
                  {{ item }}
                </IonSelectOption>
              </IonSelect>
            </IonItem>
          </IonList>

          <div class="mt-3 flex flex-wrap gap-2">
            <IonButton color="success" @click="saveSettings">
              <IonIcon  slot="start" />
              Einstellungen speichern
            </IonButton>
          </div>
        </IonCardContent>
      </IonCard>

      <IonCard class="m-0 settings-card">
        <IonCardHeader class="px-4 pt-4 pb-2">
          <IonCardTitle class="text-lg">Benachrichtigungen</IonCardTitle>
          <IonCardSubtitle>Browser-Benachrichtigungen für den FreshFlow-Prototyp.</IonCardSubtitle>
        </IonCardHeader>
        <IonCardContent class="px-4 pt-0 pb-4">
          <IonList lines="full" class="bg-transparent p-0">
            <IonItem class="settings-item">
              <IonIcon :icon="notificationsOutline" slot="start" class="settings-icon" />
              <IonLabel>
                <h3 class="m-0 text-[0.98rem] font-semibold text-color">Browser-Benachrichtigungen</h3>
                <p class="m-0 mt-1 text-sm text-muted-color">
                  Erinnerungen für Produkte und Einkaufslisten direkt im Browser.
                </p>
              </IonLabel>
              <IonToggle
                slot="end"
                :modelValue="isNotificationEnabled"
                :disabled="notificationLoading || notificationStatus === 'unsupported' || notificationStatus === 'insecure'"
                @update:modelValue="handleNotificationToggle"
              />
            </IonItem>
          </IonList>

          <div class="mt-3 flex flex-wrap gap-2">
            <IonChip v-if="notificationStatus === 'denied'" color="danger" class="m-0">
              <IonLabel>Blockiert</IonLabel>
            </IonChip>
            <IonChip v-else-if="isNotificationEnabled" color="success" class="m-0">
              <IonLabel>Aktiv</IonLabel>
            </IonChip>
            <IonChip v-else color="medium" class="m-0">
              <IonLabel>Inaktiv</IonLabel>
            </IonChip>
          </div>

          <IonNote v-if="notificationStatus === 'insecure'" color="warning" class="ion-text-wrap settings-note mt-3">
            Browser-Benachrichtigungen erfordern HTTPS oder localhost.
          </IonNote>
          <IonNote v-else-if="notificationStatus === 'unsupported'" color="warning" class="ion-text-wrap settings-note mt-3">
            Dein Browser unterstützt keine Browser-Benachrichtigungen.
          </IonNote>
          <IonNote v-else-if="notificationStatus === 'denied'" color="danger" class="ion-text-wrap settings-note mt-3">
            {{ notificationError }}
          </IonNote>
          <IonNote v-else-if="notificationStatus === 'error'" color="danger" class="ion-text-wrap settings-note mt-3">
            {{ notificationError }}
          </IonNote>
          <IonNote v-else-if="notificationStatus === 'granted'" color="success" class="ion-text-wrap settings-note mt-3">
            Browser-Benachrichtigungen sind aktiviert.
          </IonNote>
          <IonNote v-else class="ion-text-wrap settings-note mt-3" color="medium">
            Aktiviere Browser-Benachrichtigungen, um Erinnerungen für ablaufende Produkte zu erhalten.
          </IonNote>

          <div v-if="isNotificationEnabled" class="mt-3 flex flex-wrap gap-2">
            <IonButton color="success" @click="sendTestNotification">
              <IonIcon :icon="sendOutline" slot="start" />
              Test-Benachrichtigung senden
            </IonButton>
            <IonButton fill="outline" color="medium" :loading="notificationProductLoading" @click="checkExpiringProducts">
              Produkte prüfen
            </IonButton>
          </div>

          <div v-if="notificationProductError" class="mt-3">
            <IonNote color="danger" class="ion-text-wrap settings-note">{{ notificationProductError }}</IonNote>
          </div>

          <div v-if="notificationProductChecked && !notificationProductLoading" class="mt-3 flex flex-wrap gap-2">
            <IonChip v-if="notificationProductResult.alreadyExpired.length > 0" color="danger" class="m-0">
              <IonLabel>Abgelaufen: {{ notificationProductResult.alreadyExpired.length }}</IonLabel>
            </IonChip>
            <IonChip v-if="notificationProductResult.soonExpiring.length > 0" color="warning" class="m-0">
              <IonLabel>Bald ablaufend: {{ notificationProductResult.soonExpiring.length }}</IonLabel>
            </IonChip>
            <IonNote
              v-if="notificationProductResult.soonExpiring.length === 0 && notificationProductResult.alreadyExpired.length === 0"
              class="ion-text-wrap settings-note"
              color="medium"
            >
              Keine bald ablaufenden Produkte gefunden.
            </IonNote>
          </div>
        </IonCardContent>
      </IonCard>

      <IonCard class="m-0 settings-card">
        <IonCardHeader class="px-4 pt-4 pb-2">
          <IonCardTitle class="text-lg">Standort</IonCardTitle>
          <IonCardSubtitle>Freigabe für die Standortnutzung in den mobilen Ansichten.</IonCardSubtitle>
        </IonCardHeader>
        <IonCardContent class="px-4 pt-0 pb-4">
          <IonList lines="full" class="bg-transparent p-0">
            <IonItem class="settings-item">
              <IonIcon :icon="locationOutline" slot="start" class="settings-icon" />
              <IonLabel>
                <h3 class="m-0 text-[0.98rem] font-semibold text-color">Standort freigeben</h3>
                <p class="m-0 mt-1 text-sm text-muted-color">
                  Für Standortfunktionen und Distanzanzeigen in den mobilen Ansichten.
                </p>
              </IonLabel>
              <IonToggle
                slot="end"
                :modelValue="locationEnabled"
                :disabled="locationLoading"
                @update:modelValue="handleLocationToggle"
              />
            </IonItem>
          </IonList>

          <div class="mt-3 flex flex-wrap gap-2">
            <IonChip :color="locationEnabled ? 'success' : 'medium'" class="m-0">
              <IonLabel>{{ locationEnabled ? 'Standort aktiv' : 'Standort inaktiv' }}</IonLabel>
            </IonChip>
          </div>

          <IonNote v-if="locationError" color="danger" class="ion-text-wrap settings-note mt-3">
            {{ locationError }}
          </IonNote>
          <IonNote v-else class="ion-text-wrap settings-note mt-3" color="medium">
            Die Standortfreigabe wird nur bei Bedarf aktiviert.
          </IonNote>
        </IonCardContent>
      </IonCard>

      <IonCard class="m-0 settings-card">
        <IonCardHeader class="px-4 pt-4 pb-2">
          <IonCardTitle class="text-lg">Biometrie / Passkey</IonCardTitle>
          <IonCardSubtitle>Lokale Anmeldung auf Android-Geräten.</IonCardSubtitle>
        </IonCardHeader>
        <IonCardContent class="px-4 pt-0 pb-4">
          <template v-if="isAndroidNative">
            <IonList lines="full" class="bg-transparent p-0">
              <IonItem class="settings-item">
                <IonIcon :icon="shieldCheckmarkOutline" slot="start" class="settings-icon" />
                <IonLabel>
                  <h3 class="m-0 text-[0.98rem] font-semibold text-color">Biometrische Authentifizierung</h3>
                  <p class="m-0 mt-1 text-sm text-muted-color">
                    Lokale Anmeldung auf diesem Android-Gerät.
                  </p>
                </IonLabel>
                <IonToggle
                  slot="end"
                  :modelValue="biometricEnabled"
                  :disabled="biometricActivationLoading"
                  @update:modelValue="handleBiometricToggle"
                />
              </IonItem>
            </IonList>

            <div class="mt-3 flex flex-wrap gap-2">
              <IonChip v-if="biometricEnabled" color="success" class="m-0">
                <IonLabel>Eingeschaltet</IonLabel>
              </IonChip>
              <IonChip v-else-if="biometricAvailable" color="medium" class="m-0">
                <IonLabel>Ausgeschaltet</IonLabel>
              </IonChip>
              <IonChip v-else color="warning" class="m-0">
                <IonLabel>Nicht verfügbar</IonLabel>
              </IonChip>
            </div>

            <IonNote v-if="biometricActivationSuccess" color="success" class="ion-text-wrap settings-note mt-3">
              {{ biometricActivationSuccess }}
            </IonNote>
            <IonNote v-if="biometricActivationError" color="danger" class="ion-text-wrap settings-note mt-3">
              {{ biometricActivationError }}
            </IonNote>
          </template>

          <IonNote v-else color="medium" class="ion-text-wrap settings-note">
            Biometrische Anmeldung ist nur in der Android-App verfügbar.
          </IonNote>
        </IonCardContent>
      </IonCard>

      <IonCard class="m-0 settings-card">
        <IonCardHeader class="px-4 pt-4 pb-2">
          <IonCardTitle class="text-lg">Darstellung</IonCardTitle>
          <IonCardSubtitle>Optional für die Prototyp-Demo.</IonCardSubtitle>
        </IonCardHeader>
        <IonCardContent class="px-4 pt-0 pb-4">
          <IonList lines="full" class="bg-transparent p-0">
            <IonItem class="settings-item">
              <IonLabel>
                <h3 class="m-0 text-[0.98rem] font-semibold text-color">Dark Mode Simulation</h3>
                <p class="m-0 mt-1 text-sm text-muted-color">
                  Simuliert die dunkle Darstellung im Prototyp.
                </p>
              </IonLabel>
              <IonToggle slot="end" v-model="darkModeSimulation" />
            </IonItem>
          </IonList>

          <IonNote class="ion-text-wrap settings-note mt-3" color="medium">
            <span v-if="darkModeSimulation"><strong>Dark Mode simuliert.</strong></span>
            <span v-else>Standarddarstellung aktiv.</span>
          </IonNote>
        </IonCardContent>
      </IonCard>

      <IonCard class="m-0 settings-card">
        <IonCardHeader class="px-4 pt-4 pb-2">
          <IonCardTitle class="text-lg">Prototyp-Daten</IonCardTitle>
          <IonCardSubtitle>Lokale Daten zurücksetzen.</IonCardSubtitle>
        </IonCardHeader>
        <IonCardContent class="px-4 pt-0 pb-4">
          <IonButton expand="block" color="danger" fill="outline" @click="resetPrototypeData">
            <IonIcon :icon="trashOutline" slot="start" />
            Lokale Daten zurücksetzen
          </IonButton>
          <IonNote v-if="resetMessageVisible" color="success" class="ion-text-wrap settings-note mt-3">
            Lokale Daten wurden zurückgesetzt.
          </IonNote>
        </IonCardContent>
      </IonCard>
    </div>
      </main>
    </IonContent>
  </IonPage>
</template>

<style scoped>
.settings-card {
  margin: 0 0 18px 0;
  border-radius: 18px;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.06);
}

.settings-card:last-child {
  margin-bottom: 120px;
}
.settings-item {
  --padding-start: 0;
  --inner-padding-end: 0;
}

.settings-icon {
  color: var(--sg-primary);
  margin-right: 0.75rem;
  font-size: 1.15rem;
}

.settings-note {
  font-size: 0.875rem;
  line-height: 1.45;
}
</style>