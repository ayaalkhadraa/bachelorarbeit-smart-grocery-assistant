<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import {
  registerServiceWorker,
  requestNotificationPermission,
  showTestNotification,
  notifyExpiringProducts,
  type ExpiryCheckResult,
} from '@/services/notificationService'
import { type GroceryItem } from '@/stores/groceryStore'

// ── Status type ───────────────────────────────────────────
type NotificationStatus =
  | 'idle'         // Not activated yet
  | 'loading'      // Activation in progress
  | 'granted'      // Permission granted + SW registered
  | 'denied'       // User denied or browser blocked
  | 'unsupported'  // Browser missing required APIs
  | 'insecure'     // Not HTTPS / not localhost
  | 'error'        // Unexpected error

// ── State ─────────────────────────────────────────────────
const status = ref<NotificationStatus>('idle')
const errorMessage = ref('')
const subscriptionEndpoint = ref<string | null>(null)
const loading = ref(false)
const checkingProducts = ref(false)
const expiryResult = ref<ExpiryCheckResult>({ soonExpiring: [], alreadyExpired: [] })

const props = defineProps<{ products: GroceryItem[] }>()

const productCheckDone = ref(false)
const productCheckError = ref('')

// ── Environment checks (computed once, stable) ────────────
const isSecure = computed(() =>
  typeof window !== 'undefined' && window.isSecureContext
)
const hasNotificationAPI = computed(() =>
  typeof window !== 'undefined' && 'Notification' in window
)
const hasServiceWorker = computed(() =>
  typeof navigator !== 'undefined' && 'serviceWorker' in navigator
)
const hasPushManager = computed(() =>
  typeof window !== 'undefined' && 'PushManager' in window
)
const isSupported = computed(
  () => hasNotificationAPI.value && hasServiceWorker.value
)

// ── On mount: read current state ──────────────────────────
onMounted(() => {
  if (!isSecure.value) {
    status.value = 'insecure'
    return
  }
  if (!isSupported.value) {
    status.value = 'unsupported'
    return
  }
  // Reflect existing browser permission without prompting
  if (Notification.permission === 'granted') {
    status.value = 'granted'
    // Try to re-register SW silently so test notifications work after reload
    registerServiceWorker().catch(() => {/* silent */})
  } else if (Notification.permission === 'denied') {
    status.value = 'denied'
    errorMessage.value =
      'Benachrichtigungen wurden im Browser blockiert. ' +
      'Bitte erlaube sie in den Browser-Einstellungen (Schloss-Symbol in der Adressleiste) und lade die Seite neu.'
  }
})

// ── Activate flow ─────────────────────────────────────────
// ── Activate flow ─────────────────────────────────────────
async function activate() {
  if (!isSecure.value) {
    status.value = 'insecure'
    return
  }

  if (!isSupported.value) {
    status.value = 'unsupported'
    return
  }

  loading.value = true
  errorMessage.value = ''
  status.value = 'loading'

  try {
    // 1. Register Service Worker
    await registerServiceWorker()

    // 2. Request browser notification permission
    const permission = await requestNotificationPermission()

    if (permission === 'denied') {
      status.value = 'denied'
      errorMessage.value =
        'Berechtigung abgelehnt. Bitte erlaube Benachrichtigungen in den Browser-Einstellungen und lade die Seite neu.'
      return
    }

    if (permission !== 'granted') {
      status.value = 'idle'
      return
    }

    // 3. Prototype mode: local browser notifications only
    // Keine echte Web-Push-Subscription mit VAPID/Backend.
    status.value = 'granted'
  } catch (err) {
    status.value = 'error'
    errorMessage.value =
      err instanceof Error
        ? err.message
        : 'Unbekannter Fehler beim Aktivieren der Benachrichtigungen.'
  } finally {
    loading.value = false
  }
}

// ── Test notification ─────────────────────────────────────
function sendTest() {
  showTestNotification()
}

// ── Product notifications ────────────────────────────────────────────────
function sendProductNotifications() {
  console.log('[NotificationCard] Produktprüfung gestartet:', props.products)
  checkingProducts.value = true
  productCheckDone.value = false
  productCheckError.value = ''
  expiryResult.value = { soonExpiring: [], alreadyExpired: [] }
  try {
    expiryResult.value = notifyExpiringProducts(props.products)
    productCheckDone.value = true
  } catch (err) {
    productCheckError.value =
      err instanceof Error ? err.message : 'Fehler beim Prüfen der Produkte.'
  } finally {
    checkingProducts.value = false
  }
}
</script>

<template>
  <Card>
    <template #title>
      <div class="notif-title-row">
        <span>Push-Benachrichtigungen</span>
        <Tag
          v-if="status === 'granted'"
          value="Aktiv"
          severity="success"
        />
        <Tag
          v-else-if="status === 'denied'"
          value="Blockiert"
          severity="danger"
        />
      </div>
    </template>

    <template #content>
      <div class="notif-content">

        <!-- Insecure context -->
        <Message v-if="status === 'insecure'" severity="warn" :closable="false">
          Push-Benachrichtigungen erfordern <strong>HTTPS</strong> oder <strong>localhost</strong>.
          Bitte öffne die App über <code>https://</code> oder <code>http://localhost</code>.
        </Message>

        <!-- Unsupported browser -->
        <Message v-else-if="status === 'unsupported'" severity="warn" :closable="false">
          Dein Browser unterstützt keine Push-Benachrichtigungen
          (fehlt: Notification API, Service Worker oder Push API).
        </Message>

        <!-- Denied -->
        <template v-else-if="status === 'denied'">
          <Message severity="error" :closable="false">
            {{ errorMessage }}
          </Message>
        </template>

        <!-- Error -->
        <template v-else-if="status === 'error'">
          <Message severity="error" :closable="false">
            {{ errorMessage }}
          </Message>
          <Button
            label="Erneut versuchen"
            icon="pi pi-refresh"
            severity="secondary"
            outlined
            class="mt-3"
            @click="activate"
          />
        </template>

        <!-- Idle / loading -->
        <template v-else-if="status === 'idle' || status === 'loading'">
          <p class="notif-desc">
            Aktiviere Browser-Benachrichtigungen, um Erinnerungen für bald ablaufende
            Produkte und Einkaufslisten zu erhalten.
          </p>
          <Button
            label="Benachrichtigungen aktivieren"
            icon="pi pi-bell"
            :loading="loading"
            @click="activate"
          />
        </template>

        <!-- Granted -->
        <template v-else-if="status === 'granted'">
          <Message severity="success" :closable="false">
            Benachrichtigungen sind aktiviert. Du erhältst Erinnerungen direkt im Browser.
          </Message>

          <div class="notif-sub-hint">
  <i class="pi pi-info-circle" />
  Lokale Browser-Benachrichtigungen aktiv.
</div>

          <div class="notif-actions">
            <Button
              label="Test-Benachrichtigung senden"
              icon="pi pi-send"
              severity="secondary"
              outlined
              @click="sendTest"
            />
            <Button
              label="Produkt-Benachrichtigungen prüfen"
              icon="pi pi-bell"
              severity="warn"
              outlined
              :loading="checkingProducts"
              @click="sendProductNotifications"
            />
            <Button
              label="Deaktivieren"
              icon="pi pi-bell-slash"
              severity="danger"
              text
              @click="status = 'idle'"
            />
          </div>

          <!-- Expiry check results -->

          <!-- Product check error -->
          <Message v-if="productCheckError" severity="error" :closable="false">
            {{ productCheckError }}
          </Message>

          <!-- Already expired -->
          <div v-if="expiryResult.alreadyExpired.length > 0" class="notif-expiry-list notif-expiry-list--expired">
            <p class="notif-expiry-heading notif-expiry-heading--expired">
              <i class="pi pi-times-circle" />
              Bereits abgelaufen:
            </p>
            <ul class="notif-expiry-items">
              <li v-for="p in expiryResult.alreadyExpired" :key="p.id" class="notif-expiry-item">
                <i class="pi pi-calendar-times notif-expiry-icon notif-expiry-icon--expired" />
                <span>{{ p.name }}</span>
                <Tag
                  :value="p.expiryDate"
                  severity="danger"
                  class="notif-expiry-tag"
                />
              </li>
            </ul>
          </div>

          <!-- Soon expiring (days >= 0 && days <= 3) -->
          <div v-if="expiryResult.soonExpiring.length > 0" class="notif-expiry-list">
            <p class="notif-expiry-heading">
              <i class="pi pi-exclamation-triangle" />
              Läuft bald ab:
            </p>
            <ul class="notif-expiry-items">
              <li v-for="p in expiryResult.soonExpiring" :key="p.id" class="notif-expiry-item">
                <i class="pi pi-calendar-times notif-expiry-icon" />
                <span>{{ p.name }}</span>
                <Tag
                  :value="p.expiryDate"
                  severity="warn"
                  class="notif-expiry-tag"
                />
              </li>
            </ul>
          </div>

          <p v-if="expiryResult.soonExpiring.length > 0" class="notif-expiry-hint">
            Browser-Benachrichtigungen wurden für diese Produkte gesendet.
          </p>

          <!-- No soon/today products -->
          <div v-if="productCheckDone && !checkingProducts && expiryResult.soonExpiring.length === 0" class="notif-all-fresh">
            <i class="pi pi-check-circle" />
            <span>Keine Produkte laufen heute oder bald ab.</span>
          </div>
        </template>

      </div>
    </template>
  </Card>
</template>

<style scoped>
.notif-title-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.notif-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.notif-desc {
  margin: 0;
  font-size: 0.9rem;
  color: var(--p-text-muted-color, #6c757d);
}

.notif-sub-hint {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: var(--p-text-muted-color, #6c757d);
}

.notif-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.notif-expiry-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.75rem;
  border-radius: var(--p-border-radius, 6px);
  background: var(--p-orange-50, #fff7ed);
  border: 1px solid var(--p-orange-200, #fed7aa);
}

.notif-expiry-list--expired {
  background: var(--p-red-50, #fff1f2);
  border-color: var(--p-red-200, #fecaca);
}

.notif-expiry-heading {
  margin: 0 0 0.4rem 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--p-orange-700, #c2410c);
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.notif-expiry-heading--expired {
  color: var(--p-red-700, #b91c1c);
}

.notif-expiry-items {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.notif-expiry-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.notif-expiry-icon {
  color: var(--p-orange-500, #f97316);
  font-size: 0.85rem;
  flex-shrink: 0;
}

.notif-expiry-icon--expired {
  color: var(--p-red-500, #ef4444);
}

.notif-expiry-tag {
  margin-left: auto;
  font-size: 0.7rem;
}

.notif-expiry-hint {
  margin: 0.4rem 0 0 0;
  font-size: 0.75rem;
  color: var(--p-text-muted-color, #6c757d);
}

.notif-all-fresh {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: var(--p-green-600, #16a34a);
}

.mt-3 {
  margin-top: 0.75rem;
}
</style>
