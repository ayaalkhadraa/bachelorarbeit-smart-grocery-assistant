<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { Capacitor } from '@capacitor/core'
import { NativeBiometric } from '@capgo/capacitor-native-biometric'
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import ToggleSwitch from 'primevue/toggleswitch'
import Message from 'primevue/message'
import { useGroceryStore } from '@/stores/groceryStore'
import NotificationCard from '@/components/NotificationCard.vue'
import {
  checkLocalNotificationPermission,
  requestLocalNotificationPermission,
  scheduleExpiryReminderNotification,
} from '@/services/localNotificationService'

const groceryStore = useGroceryStore()
onMounted(() => {
  groceryStore.loadItems()
  console.log('[SettingsView] loaded grocery items:', groceryStore.items)
  loadBiometricSettings()
  void syncBiometricAvailability()
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
const biometricEnabled = ref(false)
const biometricAvailable = ref(false)
const biometricActivationLoading = ref(false)
const biometricActivationSuccess = ref('')
const biometricActivationError = ref('')
const expiryReminderLoading = ref(false)
const expiryReminderSuccess = ref('')
const expiryReminderError = ref('')

const languages = ['Deutsch', 'Englisch', 'Arabisch']

const SETTINGS_KEY = 'smart-grocery-settings'
const BIOMETRIC_ENABLED_KEY = 'smart-grocery-biometric-enabled'
const BIOMETRIC_STORAGE_KEY = 'smart-grocery-biometric-login'

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
  localStorage.removeItem(BIOMETRIC_STORAGE_KEY)
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
    console.error('[SettingsView] biometric availability check failed', error)
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
    console.error('[SettingsView] biometric activation failed', error)
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

async function testExpiryReminder(): Promise<void> {
  expiryReminderSuccess.value = ''
  expiryReminderError.value = ''

  if (!isAndroidNative.value) {
    expiryReminderError.value = 'Ablauf-Erinnerungen sind nur in der Android-App verfügbar.'
    return
  }

  expiryReminderLoading.value = true

  try {
    const permissionGranted =
      (await checkLocalNotificationPermission()) || (await requestLocalNotificationPermission())

    if (!permissionGranted) {
      expiryReminderError.value = 'Die Berechtigung für lokale Benachrichtigungen wurde nicht erteilt.'
      return
    }

    const result = await scheduleExpiryReminderNotification(groceryStore.items)

    if (result.count === 0) {
      expiryReminderError.value = result.message
      return
    }

    expiryReminderSuccess.value = result.message
  } catch (error) {
    console.error('[SettingsView] expiry reminder test failed', error)
    expiryReminderError.value =
      error instanceof Error ? error.message : 'Die Ablauf-Erinnerung konnte nicht ausgelöst werden.'
  } finally {
    expiryReminderLoading.value = false
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
  <main class="max-w-[1000px] mx-auto">
    <div class="mb-6">
      <h1 class="text-[1.75rem] font-bold m-0 mb-1">Einstellungen</h1>
      <p class="text-muted-color m-0">Verwaltung einfacher Prototyp-Einstellungen.</p>
    </div>

    <Message severity="info" :closable="false">
      Diese Einstellungen dienen der Simulation im Web-Prototyp und ersetzen kein vollständiges Benutzerkonto.
    </Message>

    <Card v-if="isAndroidNative" class="mt-6 mb-6">
      <template #title>Mobile Funktionen</template>
      <template #content>
        <div class="space-y-4">
          <section class="rounded-[var(--sg-radius-md)] border border-[var(--sg-border)] bg-[var(--sg-surface-2)] p-4">
            <div class="flex items-center justify-between gap-4">
              <div class="min-w-0">
                <h3 class="text-[0.95rem] font-semibold m-0">Biometrische Authentifizierung</h3>
                <p class="text-[0.82rem] text-muted-color m-0 mt-1">
                  Lokale Anmeldung auf diesem Android-Gerät.
                </p>
              </div>
              <ToggleSwitch
                class="sg-toggle"
                :modelValue="biometricEnabled"
                :disabled="biometricActivationLoading"
                aria-label="Biometrische Authentifizierung umschalten"
                @update:modelValue="handleBiometricToggle"
              />
            </div>

            <p class="text-[0.82rem] m-0 mt-3 text-muted-color">
              Status:
              <span v-if="biometricEnabled" class="text-[var(--sg-success)] font-medium">Eingeschaltet</span>
              <span v-else-if="biometricAvailable" class="font-medium">Ausgeschaltet</span>
              <span v-else class="text-[var(--sg-warning)] font-medium">Nicht verfügbar</span>
            </p>

            <Message v-if="biometricActivationSuccess" severity="success" :closable="false" class="mt-3 mb-0">
              {{ biometricActivationSuccess }}
            </Message>

            <Message v-if="biometricActivationError" severity="error" :closable="false" class="mt-3 mb-0">
              {{ biometricActivationError }}
            </Message>
          </section>

          <section class="rounded-[var(--sg-radius-md)] border border-[var(--sg-border)] bg-[var(--sg-surface-2)] p-4">
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <h3 class="text-[0.95rem] font-semibold m-0">Ablauf-Erinnerung</h3>
                <p class="text-[0.82rem] text-muted-color m-0 mt-1">
                  Testet die lokale Erinnerung mit aktuellen Produkten.
                </p>
              </div>
              <Button
                label="Testen"
                icon="pi pi-bell"
                :loading="expiryReminderLoading"
                severity="secondary"
                outlined
                size="small"
                type="button"
                @click="testExpiryReminder"
              />
            </div>

            <Message v-if="expiryReminderSuccess" severity="success" :closable="false" class="mt-3 mb-0">
              {{ expiryReminderSuccess }}
            </Message>

            <Message v-if="expiryReminderError" severity="warn" :closable="false" class="mt-3 mb-0">
              {{ expiryReminderError }}
            </Message>
          </section>
        </div>
      </template>
    </Card>

    <Divider />

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      <!-- Card: Profil -->
      <Card>
        <template #title>Profil</template>
        <template #content>
          <div class="flex flex-col gap-[0.4rem] mb-4">
            <label for="username" class="text-sm font-medium">Benutzername</label>
            <InputText id="username" v-model="username" placeholder="Benutzername eingeben" />
          </div>
          <div class="flex flex-col gap-[0.4rem] mb-4">
            <label for="language" class="text-sm font-medium">Sprache</label>
            <Select
              id="language"
              v-model="language"
              :options="languages"
              placeholder="Sprache wählen"
            />
          </div>
          <div class="mt-2">
            <Button label="Einstellungen speichern" icon="pi pi-save" @click="saveSettings" />
          </div>
        </template>
      </Card>

      <!-- Card: Benachrichtigungen (Push) -->
      <NotificationCard :products="groceryStore.items" />

      <!-- Card: Darstellung -->
      <Card>
        <template #title>Darstellung</template>
        <template #content>
          <div class="flex items-center justify-between gap-4 mb-3">
            <span class="text-[0.95rem] flex-1">Dark Mode Simulation</span>
            <ToggleSwitch v-model="darkModeSimulation" />
          </div>
          <p class="text-[0.85rem] text-muted-color m-0 mt-1">
            <span v-if="darkModeSimulation"><strong>Dark Mode simuliert</strong></span>
            <span v-else>Standarddarstellung aktiv</span>
          </p>
        </template>
      </Card>

      <!-- Card: Prototyp-Daten -->
      <Card>
        <template #title>Prototyp-Daten</template>
        <template #content>
          <p class="text-[0.85rem] text-muted-color m-0">Nutze den Zurücksetzen-Button, um den Ausgangszustand wiederherzustellen.</p>
          <div class="mt-3">
            <Button
              label="Lokale Daten zurücksetzen"
              severity="danger"
              outlined
              icon="pi pi-trash"
              @click="resetPrototypeData"
            />
          </div>
          <Message v-if="resetMessageVisible" severity="success" :closable="false" class="mt-4">
            Lokale Daten wurden zurückgesetzt.
          </Message>
        </template>
      </Card>
    </div>
  </main>
</template>

<style scoped>
/* ── Full-width PrimeVue inputs inside form fields ───────── */
.form-field :deep(.p-inputtext),
.form-field :deep(.p-select) {
  width: 100%;
}

:deep(.sg-toggle.p-toggleswitch-checked .p-toggleswitch-slider) {
  background: var(--sg-success);
  border-color: var(--sg-success);
}

:deep(.sg-toggle .p-toggleswitch-slider) {
  background: var(--sg-surface-0, #fff);
  border-color: var(--sg-border);
}

:deep(.sg-toggle .p-toggleswitch-handle) {
  background: var(--sg-surface-0, #fff);
}

/* ── Mobile: full-width buttons ──────────────────────────── */
@media (max-width: 900px) {
  .actions .p-button,
  .danger-zone .p-button {
    width: 100%;
    justify-content: center;
  }
}
</style>
