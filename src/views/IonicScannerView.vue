<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, nextTick, ref } from 'vue'
import { Capacitor } from '@capacitor/core'
import {
  CapacitorBarcodeScanner,
  CapacitorBarcodeScannerAndroidScanningLibrary,
  CapacitorBarcodeScannerTypeHintALLOption
} from '@capacitor/barcode-scanner'
import {
  IonAlert,
  IonBadge,
  IonButton,
  IonContent,
  IonInput,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonModal,
  IonPage,
  IonText,
  IonToast
} from '@ionic/vue'
import { useGroceryStore } from '@/stores/groceryStore'

const groceryStore = useGroceryStore()
type AddItemPayload = Parameters<typeof groceryStore.addItem>[0]

interface SimulatedProduct {
  barcode: string
  name: string
  category: string
  expiryDate?: string
}

interface ScanHistoryEntry {
  id: number
  barcode: string
  productName: string
  category: string
  result: 'Gefunden' | 'Nicht gefunden'
  target: 'Noch nicht übernommen' | 'Inventar' | 'Einkaufsliste'
  scannedAt: string
}

const isScanning = ref(false)
const scanCompleted = ref(false)
const scannedBarcode = ref('')
const scannedProduct = ref<SimulatedProduct | null>(null)

const showAddInventoryModal = ref(false)
const dialogQuantityInput = ref('1')
const dialogExpiryDateInput = ref('')

const cameraActive = ref(false)
const cameraError = ref('')
const videoRef = ref<HTMLVideoElement | null>(null)
let cameraStream: MediaStream | null = null

const SCAN_HISTORY_KEY = 'freshflow-scan-history'
const scanHistory = ref<ScanHistoryEntry[]>([])

const showToast = ref(false)
const toastMessage = ref('')
const toastColor = ref<'success' | 'warning' | 'danger' | 'medium'>('success')

const showClearHistoryAlert = ref(false)

const isWebSimulation = computed(() => Capacitor.getPlatform() !== 'android')

const simulatedProducts: SimulatedProduct[] = [
  { barcode: '4006381333931', name: 'Vollmilch 3,5%', category: 'Milchprodukte', expiryDate: '2026-06-25' },
  { barcode: '4000539011009', name: 'Bananen', category: 'Obst & Gemüse' },
  { barcode: '4008117801220', name: 'Naturjoghurt', category: 'Milchprodukte', expiryDate: '2026-06-22' },
  { barcode: '4009233133956', name: 'Vollkornbrot', category: 'Backwaren', expiryDate: '2026-06-18' },
  { barcode: '4056489123456', name: 'Rispentomaten', category: 'Obst & Gemüse' }
]

const UNKNOWN_BARCODE = '9999999999999'

function loadScanHistory(): void {
  try {
    const raw = localStorage.getItem(SCAN_HISTORY_KEY)
    if (raw) {
      scanHistory.value = JSON.parse(raw) as ScanHistoryEntry[]
    }
  } catch {
    scanHistory.value = []
  }
}

function saveScanHistory(): void {
  localStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(scanHistory.value))
}

function setToast(color: 'success' | 'warning' | 'danger' | 'medium', message: string): void {
  toastColor.value = color
  toastMessage.value = message
  showToast.value = true
}

function buildInventoryAddPayload(
  product: SimulatedProduct,
  barcode: string,
  quantity: number,
  expiryDate: string
): AddItemPayload {
  return {
    name: product.name.trim(),
    category: product.category,
    quantity: Math.max(1, Number(quantity) || 1),
    unit: 'Stück',
    expiryDate: expiryDate.trim(),
    location: 'Küche',
    favorite: false,
    inShoppingList: false,
    bought: false,
    barcode
  }
}

function buildShoppingListAddPayload(
  product: SimulatedProduct,
  barcode: string
): AddItemPayload {
  return {
    name: product.name.trim(),
    category: product.category,
    quantity: 1,
    unit: 'Stück',
    expiryDate: '',
    location: '',
    favorite: false,
    inShoppingList: true,
    bought: false,
    barcode
  }
}

function getSimulatedProduct(barcode: string): SimulatedProduct | null {
  return simulatedProducts.find((item) => item.barcode === barcode) ?? null
}

function updateHistoryTarget(barcode: string, target: 'Inventar' | 'Einkaufsliste'): void {
  const entry = scanHistory.value.find(
    (item) => item.barcode === barcode && item.target === 'Noch nicht übernommen'
  )

  if (entry) {
    entry.target = target
    saveScanHistory()
  }
}

function handleScanResult(barcode: string): void {
  scannedBarcode.value = barcode
  scannedProduct.value = getSimulatedProduct(barcode)
  isScanning.value = false
  scanCompleted.value = true

  const entry: ScanHistoryEntry = {
    id: Date.now(),
    barcode,
    productName: scannedProduct.value?.name ?? 'Unbekannt',
    category: scannedProduct.value?.category ?? '-',
    result: scannedProduct.value ? 'Gefunden' : 'Nicht gefunden',
    target: 'Noch nicht übernommen',
    scannedAt: new Date().toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  scanHistory.value.unshift(entry)
  scanHistory.value = scanHistory.value.slice(0, 10)
  saveScanHistory()
}

async function startScan(): Promise<void> {
  isScanning.value = true
  scanCompleted.value = false
  scannedBarcode.value = ''
  scannedProduct.value = null
  cameraError.value = ''

  if (Capacitor.getPlatform() === 'android') {
    try {
      const result = await CapacitorBarcodeScanner.scanBarcode({
        hint: CapacitorBarcodeScannerTypeHintALLOption.ALL,
        scanButton: true,
        scanText: 'Barcode scannen',
        scanInstructions: 'Barcode vor die Kamera halten',
        android: {
          scanningLibrary: CapacitorBarcodeScannerAndroidScanningLibrary.MLKIT
        }
      })

      if (!result.ScanResult) {
        isScanning.value = false
        return
      }

      handleScanResult(result.ScanResult)
      return
    } catch {
      isScanning.value = false
      cameraError.value = 'Der Barcode-Scanner konnte nicht gestartet werden.'
      return
    }
  }

  setTimeout(() => {
    const roll = Math.random()
    const barcode =
      roll < 0.15
        ? UNKNOWN_BARCODE
        : simulatedProducts[Math.floor(Math.random() * simulatedProducts.length)]!.barcode

    handleScanResult(barcode)
  }, 1500)
}

async function startCamera(): Promise<void> {
  cameraError.value = ''

  if (!navigator.mediaDevices?.getUserMedia) {
    cameraError.value = 'Kamera-Zugriff wird in diesem Browser nicht unterstützt. Bitte eine sichere Verbindung (HTTPS oder localhost) verwenden.'
    return
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' }
      },
      audio: false
    })

    cameraStream = stream
    cameraActive.value = true

    await nextTick()

    if (videoRef.value) {
      videoRef.value.srcObject = stream
      await videoRef.value.play()
    }
  } catch (error) {
    if (error instanceof DOMException) {
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        cameraError.value = 'Kamera-Zugriff verweigert. Klicke auf das Schloss-Symbol in der Adressleiste des Browsers → „Kamera" → „Erlauben“, dann die Seite neu laden.'
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        cameraError.value = 'Keine Kamera gefunden. Bitte ein Gerät mit Kamera verwenden.'
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        cameraError.value = 'Kamera wird bereits von einer anderen Anwendung verwendet.'
      } else if (error.name === 'OverconstrainedError') {
        cameraError.value = 'Die angeforderte Kamera-Konfiguration wird nicht unterstützt.'
      } else {
        cameraError.value = `Kamera konnte nicht geöffnet werden (${error.name}).`
      }
    } else {
      cameraError.value = 'Kamera konnte nicht geöffnet werden. Bitte Berechtigung prüfen.'
    }

    cameraActive.value = false
  }
}

function stopCamera(): void {
  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop())
    cameraStream = null
  }

  cameraActive.value = false

  if (videoRef.value) {
    videoRef.value.srcObject = null
  }
}

function resetScan(): void {
  isScanning.value = false
  scanCompleted.value = false
  scannedBarcode.value = ''
  scannedProduct.value = null
}

function openAddToInventoryDialog(): void {
  if (!scannedProduct.value) return

  dialogQuantityInput.value = '1'
  dialogExpiryDateInput.value = scannedProduct.value.expiryDate ?? ''
  showAddInventoryModal.value = true
}

function addProductToInventory(
  product: SimulatedProduct,
  barcode: string,
  quantity: number,
  expiryDate: string
): boolean {
  const existing = groceryStore.items.find(
    (item) => item.barcode === barcode && !item.inShoppingList
  )

  if (existing) {
    setToast('warning', `„${product.name}" ist bereits im Inventar vorhanden.`)
    return false
  }

  const safeQuantity = Math.max(1, Number(quantity) || 0)
  const safeExpiryDate = expiryDate.trim()

  if (!safeQuantity) {
    setToast('warning', 'Bitte eine gültige Menge angeben.')
    return false
  }

  if (!safeExpiryDate) {
    setToast('warning', 'Bitte ein Ablaufdatum angeben, bevor du das Produkt speicherst.')
    return false
  }

  const beforeCount = groceryStore.items.length
  groceryStore.addItem(
    buildInventoryAddPayload(product, barcode, safeQuantity, safeExpiryDate)
  )
  const added = groceryStore.items.length > beforeCount

  if (!added) {
    setToast('danger', 'Das Produkt konnte nicht im Inventar gespeichert werden.')
    return false
  }

  updateHistoryTarget(barcode, 'Inventar')
  setToast('success', 'Produkt wurde dem Inventar hinzugefügt.')
  return true
}

function addProductToShoppingList(product: SimulatedProduct, barcode: string): boolean {
  const existing = groceryStore.items.find(
    (item) => item.barcode === barcode && item.inShoppingList
  )

  if (existing) {
    setToast('warning', `„${product.name}" ist bereits in der Einkaufsliste.`)
    return false
  }

  const beforeCount = groceryStore.items.length
  groceryStore.addItem(buildShoppingListAddPayload(product, barcode))
  const added = groceryStore.items.length > beforeCount

  if (!added) {
    setToast('danger', 'Das Produkt konnte nicht zur Einkaufsliste hinzugefügt werden.')
    return false
  }

  updateHistoryTarget(barcode, 'Einkaufsliste')
  setToast('success', 'Produkt wurde zur Einkaufsliste hinzugefügt.')
  return true
}

function confirmAddToInventory(): void {
  if (!scannedProduct.value) return

  const quantity = Math.max(1, Number(dialogQuantityInput.value) || 1)
  const expiryDate = dialogExpiryDateInput.value.trim().split('T')[0] ?? ''
  if (!quantity) {
    setToast('warning', 'Bitte eine gültige Menge angeben.')
    return
  }

  if (!expiryDate) {
    setToast('warning', 'Bitte ein Ablaufdatum angeben.')
    return
  }

  const wasAdded = addProductToInventory(
    scannedProduct.value,
    scannedBarcode.value,
    quantity,
    expiryDate
  )

  showAddInventoryModal.value = false

  if (wasAdded) {
    resetScan()
  }
}

function addScannedProductToShoppingList(): void {
  if (!scannedProduct.value) return

  const wasAdded = addProductToShoppingList(scannedProduct.value, scannedBarcode.value)

  if (wasAdded) {
    resetScan()
  }
}

function addHistoryEntryToInventory(entry: ScanHistoryEntry): void {
  const product = getSimulatedProduct(entry.barcode)
  if (!product) {
    setToast('danger', 'Für diesen Barcode sind keine Produktdaten verfügbar.')
    return
  }

  addProductToInventory(product, entry.barcode, 1, product.expiryDate ?? '')
}

function addHistoryEntryToShoppingList(entry: ScanHistoryEntry): void {
  const product = getSimulatedProduct(entry.barcode)
  if (!product) {
    setToast('danger', 'Für diesen Barcode sind keine Produktdaten verfügbar.')
    return
  }

  addProductToShoppingList(product, entry.barcode)
}

function removeHistoryEntry(entryId: number): void {
  scanHistory.value = scanHistory.value.filter((entry) => entry.id !== entryId)
  saveScanHistory()
}

function clearScanHistory(): void {
  scanHistory.value = []
  saveScanHistory()
}

function getResultBadgeColor(result: ScanHistoryEntry['result']): 'success' | 'warning' {
  return result === 'Gefunden' ? 'success' : 'warning'
}

function getTargetBadgeColor(target: ScanHistoryEntry['target']): 'success' | 'medium' | 'warning' {
  if (target === 'Inventar') return 'success'
  if (target === 'Einkaufsliste') return 'medium'
  return 'warning'
}

onMounted(() => {
  loadScanHistory()
})

onBeforeUnmount(() => {
  stopCamera()
})
</script>

<template>
  <IonPage>
    <IonContent :fullscreen="true">
      <main class="scanner-page">
    <header class="scanner-heading">
      <h1>Scanner</h1>
      <p>Produkte per Barcode erfassen</p>
    </header>

    <section class="scanner-area" aria-labelledby="scanner-area-title">
      <h2 id="scanner-area-title" class="sr-only">Barcode- und Kamerabereich</h2>

      <div class="scan-frame" :class="{ 'scan-frame--camera-active': cameraActive }">
        <video
          v-if="cameraActive"
          ref="videoRef"
          class="camera-preview"
          autoplay
          playsinline
          muted
        ></video>

        <div v-else class="scan-frame-placeholder">
          <span class="scan-line" aria-hidden="true"></span>
          <span>Barcode in den Rahmen halten</span>
        </div>

        <span class="scan-corner scan-corner--top-left" aria-hidden="true"></span>
        <span class="scan-corner scan-corner--top-right" aria-hidden="true"></span>
        <span class="scan-corner scan-corner--bottom-left" aria-hidden="true"></span>
        <span class="scan-corner scan-corner--bottom-right" aria-hidden="true"></span>

        <IonBadge
          v-if="isWebSimulation && !cameraActive"
          class="simulation-badge"
          color="medium"
        >
         
        </IonBadge>
      </div>

      <p class="scanner-hint">
        Kamera öffnen – Erkennung wird im Web simuliert.
      </p>

      <IonText v-if="cameraError" color="warning">
        <p class="camera-error">{{ cameraError }}</p>
      </IonText>

      <div class="scanner-actions">
        <IonButton
          expand="block"
          color="success"
          class="scan-action-button scan-action-button--primary"
          :disabled="isScanning"
          @click="startScan"
        >
          {{ isScanning ? 'Scan läuft …' : 'Scan starten' }}
        </IonButton>

        <IonButton
          expand="block"
          :fill="cameraActive ? 'solid' : 'outline'"
          :color="cameraActive ? 'medium' : 'success'"
          class="scan-action-button"
          @click="cameraActive ? stopCamera() : startCamera()"
        >
          {{ cameraActive ? 'Kamera schließen' : 'Kamera öffnen' }}
        </IonButton>
      </div>
    </section>

    <section v-if="scanCompleted" class="scan-result-section">
      <div class="compact-panel">
        <div class="compact-panel-heading">
          <span>Erkannter Barcode</span>
          <IonBadge color="success">Scan erfolgreich</IonBadge>
        </div>

        <p class="barcode-value">{{ scannedBarcode }}</p>
      </div>

      <div class="compact-panel">
        <div class="compact-panel-heading">
          <span>Produktdaten</span>
        </div>

        <template v-if="scannedProduct">
          <div class="product-result">
            <div class="product-result-main">
              <strong>{{ scannedProduct.name }}</strong>
              <span>
                {{ scannedProduct.category }}
                <template v-if="scannedProduct.expiryDate">
                  · MHD {{ scannedProduct.expiryDate }}
                </template>
              </span>
            </div>

            <IonBadge color="medium">Simuliert</IonBadge>
          </div>

          <div class="result-actions">
            <IonButton
              expand="block"
              color="success"
              @click="openAddToInventoryDialog"
            >
              Zum Inventar
            </IonButton>

            <IonButton
              expand="block"
              fill="outline"
              color="success"
              @click="addScannedProductToShoppingList"
            >
              Einkaufsliste
            </IonButton>
          </div>
        </template>

        <template v-else>
          <IonText color="warning">
            <p class="result-warning">
              Für diesen Barcode wurden keine Produktdaten gefunden.
            </p>
          </IonText>

          <IonButton
            expand="block"
            fill="outline"
            color="medium"
            @click="resetScan"
          >
            Manuell zurücksetzen
          </IonButton>
        </template>
      </div>
    </section>

    <section class="history-section">
      <div class="history-heading">
        <h2>Scan-Historie</h2>

        <IonButton
          v-if="scanHistory.length"
          fill="clear"
          color="medium"
          size="small"
          class="clear-history-button"
          @click="showClearHistoryAlert = true"
        >
          Historie leeren
        </IonButton>
      </div>

      <IonList
        v-if="scanHistory.length"
        lines="none"
        class="history-list"
      >
        <IonItemSliding
          v-for="entry in scanHistory"
          :key="entry.id"
          class="history-sliding-item"
        >
          <IonItem
            lines="none"
            class="history-item"
            :detail="false"
          >
            <IonLabel class="history-label ion-text-wrap">
              <div class="history-row">
                <div class="history-product">
                  <h3>{{ entry.productName }}</h3>

                  <p>
                    {{ entry.barcode }} · {{ entry.category }} · {{ entry.scannedAt }}
                  </p>
                </div>

                <div class="history-statuses">
                  <IonBadge
                    :color="getResultBadgeColor(entry.result)"
                    class="history-badge history-badge--result"
                  >
                    {{ entry.result }}
                  </IonBadge>

                  <IonBadge
                    :color="getTargetBadgeColor(entry.target)"
                    class="history-badge history-badge--target"
                  >
                    {{
                      entry.target === 'Noch nicht übernommen'
                        ? 'Nicht übernommen'
                        : entry.target
                    }}
                  </IonBadge>
                </div>
              </div>
            </IonLabel>
          </IonItem>

          <IonItemOptions side="start">
            <IonItemOption
              color="success"
              @click="addHistoryEntryToInventory(entry)"
            >
              Zum Inventar
            </IonItemOption>

            <IonItemOption
              color="medium"
              @click="addHistoryEntryToShoppingList(entry)"
            >
              Einkaufsliste
            </IonItemOption>
          </IonItemOptions>

          <IonItemOptions side="end">
            <IonItemOption
              color="danger"
              @click="removeHistoryEntry(entry.id)"
            >
              Löschen
            </IonItemOption>
          </IonItemOptions>
        </IonItemSliding>
      </IonList>

      <div v-else class="empty-history">
        Noch keine Scans vorhanden.
      </div>
    </section>

    <IonModal
      :is-open="showAddInventoryModal"
      :initial-breakpoint="0.4"
      :breakpoints="[0, 0.4, 0.72]"
      :handle="true"
      @didDismiss="showAddInventoryModal = false"
    >
      <div class="inventory-modal-content">
        <div class="inventory-modal-heading">
          <div>
            <h2>
              {{
                scannedProduct
                  ? `${scannedProduct.name} zum Inventar hinzufügen`
                  : 'Zum Inventar hinzufügen'
              }}
            </h2>

            <p>Menge und optionales Ablaufdatum festlegen.</p>
          </div>

          <IonButton
            fill="clear"
            color="medium"
            size="small"
            @click="showAddInventoryModal = false"
          >
            Schließen
          </IonButton>
        </div>

        <IonList inset lines="full" class="inventory-modal-list">
          <IonItem>
            <IonLabel position="stacked">Menge</IonLabel>
            <IonInput
              v-model="dialogQuantityInput"
              type="number"
              inputmode="numeric"
              min="1"
              max="999"
            />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">
              Ablaufdatum
              <span class="optional-label">(optional)</span>
            </IonLabel>

            <IonInput
              v-model="dialogExpiryDateInput"
              type="date"
            />
          </IonItem>
        </IonList>

        <div class="inventory-modal-actions">
          <IonButton
            expand="block"
            fill="outline"
            color="medium"
            @click="showAddInventoryModal = false"
          >
            Abbrechen
          </IonButton>

          <IonButton
            expand="block"
            color="success"
            @click="confirmAddToInventory"
          >
            Hinzufügen
          </IonButton>
        </div>
      </div>
    </IonModal>

    <IonAlert
      :is-open="showClearHistoryAlert"
      header="Historie leeren"
      message="Alle Scan-Einträge werden entfernt."
      :buttons="[
        { text: 'Abbrechen', role: 'cancel' },
        { text: 'Leeren', role: 'destructive', handler: clearScanHistory }
      ]"
      @didDismiss="showClearHistoryAlert = false"
    />

    <IonToast
      :is-open="showToast"
      :message="toastMessage"
      :color="toastColor"
      duration="2500"
      position="top"
      @didDismiss="showToast = false"
    />
      </main>
    </IonContent>
  </IonPage>
</template>

<style scoped>
:host {
  --freshflow-green: var(--sg-primary, #16a34a);
  --freshflow-green-strong: #15803d;
  --freshflow-green-soft: rgba(22, 163, 74, 0.12);
  --scanner-surface: var(--sg-surface, #ffffff);
  --scanner-border: var(--sg-border, #dde3df);
  --scanner-text: var(--sg-text, #1f2937);
  --scanner-muted: var(--sg-muted, #6b7280);
}

.scanner-page {
  width: min(100%, 42rem);
  margin: 0 auto;
  padding:
    1rem
    0.875rem
    calc(7rem + env(safe-area-inset-bottom));
}

.scanner-heading h1 {
  margin: 0;
  color: var(--scanner-text);
  font-size: clamp(1.8rem, 7vw, 2.1rem);
  font-weight: 780;
  letter-spacing: -0.03em;
  line-height: 1.05;
}

.scanner-heading p {
  margin: 0.45rem 0 0;
  color: var(--scanner-muted);
  font-size: 0.875rem;
  line-height: 1.4;
}

.scanner-area {
  margin-top: 1rem;
}

.scan-frame {
  position: relative;
  display: grid;
  min-height: 9.75rem;
  place-items: center;
  overflow: hidden;
  border-radius: 1rem;
  background: #07150e;
  box-shadow: 0 0.3rem 1rem rgba(7, 21, 14, 0.14);
}

.scan-frame-placeholder {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  padding: 2rem 1rem;
  color: rgba(255, 255, 255, 0.78);
  font-size: 0.78rem;
  text-align: center;
}

.scan-line {
  display: block;
  width: min(78%, 19rem);
  height: 0.18rem;
  border-radius: 999px;
  background: var(--freshflow-green);
  box-shadow: 0 0 0.55rem rgba(22, 163, 74, 0.5);
}

.camera-preview {
  width: 100%;
  height: 100%;
  min-height: 9.75rem;
  max-height: 17rem;
  object-fit: cover;
}

.scan-frame--camera-active::after {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.08),
    transparent 30%,
    transparent 70%,
    rgba(0, 0, 0, 0.12)
  );
  content: '';
  pointer-events: none;
}

.scan-corner {
  position: absolute;
  z-index: 2;
  width: 1.7rem;
  height: 1.7rem;
  pointer-events: none;
}

.scan-corner--top-left {
  top: 0.85rem;
  left: 0.85rem;
  border-top: 0.22rem solid var(--freshflow-green);
  border-left: 0.22rem solid var(--freshflow-green);
}

.scan-corner--top-right {
  top: 0.85rem;
  right: 0.85rem;
  border-top: 0.22rem solid var(--freshflow-green);
  border-right: 0.22rem solid var(--freshflow-green);
}

.scan-corner--bottom-left {
  bottom: 0.85rem;
  left: 0.85rem;
  border-bottom: 0.22rem solid var(--freshflow-green);
  border-left: 0.22rem solid var(--freshflow-green);
}

.scan-corner--bottom-right {
  right: 0.85rem;
  bottom: 0.85rem;
  border-right: 0.22rem solid var(--freshflow-green);
  border-bottom: 0.22rem solid var(--freshflow-green);
}

.simulation-badge {
  position: absolute;
  z-index: 3;
  top: 0.65rem;
  left: 50%;
  transform: translateX(-50%);
  opacity: 0.82;
}

.scanner-hint {
  margin: 0.65rem 0 0;
  color: var(--scanner-muted);
  font-size: 0.72rem;
  line-height: 1.35;
}

.camera-error {
  margin: 0.65rem 0 0;
  font-size: 0.82rem;
  line-height: 1.4;
}

.scanner-actions {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 0.9fr);
  gap: 0.65rem;
  margin-top: 0.75rem;
}

.scan-action-button {
  min-width: 0;
  min-height: 2.8rem;
  margin: 0;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: none;
  --border-radius: 999px;
  --box-shadow: none;
}

.scan-action-button--primary {
  --background: var(--freshflow-green);
  --background-hover: var(--freshflow-green-strong);
  --background-activated: var(--freshflow-green-strong);
  --color: #ffffff;
}

.scan-result-section {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  margin-top: 1.1rem;
}

.compact-panel {
  padding: 0.9rem;
  border: 1px solid var(--scanner-border);
  border-radius: 1rem;
  background: var(--scanner-surface);
  box-shadow: 0 0.15rem 0.6rem rgba(15, 23, 42, 0.05);
}

.compact-panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  color: var(--scanner-text);
  font-size: 0.85rem;
  font-weight: 700;
}

.barcode-value {
  margin: 0.7rem 0 0;
  overflow-wrap: anywhere;
  color: var(--scanner-text);
  font-family: 'Courier New', Courier, monospace;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.055em;
}

.product-result {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.product-result-main {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 0.25rem;
}

.product-result-main strong {
  color: var(--scanner-text);
  font-size: 0.95rem;
}

.product-result-main span {
  color: var(--scanner-muted);
  font-size: 0.75rem;
  line-height: 1.35;
}

.result-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.55rem;
  margin-top: 0.85rem;
}

.result-actions IonButton {
  min-width: 0;
  margin: 0;
  font-size: 0.72rem;
  text-transform: none;
  --border-radius: 999px;
}

.result-warning {
  margin: 0.75rem 0;
  font-size: 0.82rem;
  line-height: 1.4;
}

.history-section {
  margin-top: 1.15rem;
}

.history-heading {
  display: flex;
  min-height: 2.2rem;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.history-heading h2 {
  margin: 0;
  color: var(--scanner-text);
  font-size: 1.05rem;
  font-weight: 750;
}

.clear-history-button {
  height: auto;
  margin: 0;
  font-size: 0.68rem;
  text-transform: none;
}

.history-list {
  margin-top: 0.4rem;
  padding: 0;
  background: transparent;
}

.history-sliding-item {
  margin-bottom: 0.55rem;
  overflow: hidden;
  border: 1px solid var(--scanner-border);
  border-radius: 0.85rem;
  background: var(--scanner-surface);
  box-shadow: 0 0.12rem 0.45rem rgba(15, 23, 42, 0.055);
}

.history-item {
  --min-height: auto;
  --padding-start: 0;
  --inner-padding-end: 0;
  --inner-padding-top: 0;
  --inner-padding-bottom: 0;
  --background: var(--scanner-surface);
}

.history-label {
  margin: 0;
}

.history-row {
  display: grid;
  width: 100%;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.65rem;
  padding: 0.72rem 0.75rem;
}

.history-product {
  min-width: 0;
}

.history-product h3 {
  margin: 0;
  overflow: hidden;
  color: var(--scanner-text);
  font-size: 0.88rem;
  font-weight: 720;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-product p {
  margin: 0.35rem 0 0;
  overflow: hidden;
  color: var(--scanner-muted);
  font-size: 0.64rem;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-statuses {
  display: flex;
  max-width: 7.8rem;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.35rem;
}

.history-badge {
  max-width: 100%;
  overflow: hidden;
  border-radius: 999px;
  font-size: 0.59rem;
  font-weight: 700;
  text-overflow: ellipsis;
  text-transform: none;
  white-space: nowrap;
  --padding-start: 0.55rem;
  --padding-end: 0.55rem;
  --padding-top: 0.26rem;
  --padding-bottom: 0.26rem;
}

.history-badge--result {
  --background: rgba(22, 163, 74, 0.12);
  --color: var(--freshflow-green-strong);
}

.history-badge--target {
  --background: rgba(37, 99, 235, 0.1);
  --color: #1d4ed8;
}

.empty-history {
  margin-top: 0.4rem;
  padding: 1.5rem 1rem;
  border: 1px dashed var(--scanner-border);
  border-radius: 0.85rem;
  background: var(--scanner-surface);
  color: var(--scanner-muted);
  font-size: 0.82rem;
  text-align: center;
}

.inventory-modal-content {
  display: flex;
  max-height: 86vh;
  flex-direction: column;
  gap: 1rem;
  overflow-y: auto;
  padding: 0.5rem 1rem calc(1rem + env(safe-area-inset-bottom));
}

.inventory-modal-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.inventory-modal-heading h2 {
  margin: 0;
  color: var(--scanner-text);
  font-size: 1.05rem;
  font-weight: 750;
  line-height: 1.3;
}

.inventory-modal-heading p {
  margin: 0.35rem 0 0;
  color: var(--scanner-muted);
  font-size: 0.78rem;
  line-height: 1.35;
}

.inventory-modal-list {
  padding: 0;
  background: transparent;
}

.optional-label {
  color: var(--scanner-muted);
}

.inventory-modal-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.65rem;
}

.inventory-modal-actions IonButton {
  margin: 0;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
  margin: -1px;
  white-space: nowrap;
}

:deep(ion-button[color='success']) {
  --background: var(--freshflow-green);
  --background-hover: var(--freshflow-green-strong);
  --background-activated: var(--freshflow-green-strong);
  --color: #ffffff;
}

:deep(ion-button[color='success'].button-outline) {
  --background: transparent;
  --border-color: var(--freshflow-green);
  --color: var(--freshflow-green);
}

@media (min-width: 40rem) {
  .scanner-page {
    padding-inline: 1rem;
  }
}

@media (max-width: 22rem) {
  .scanner-actions,
  .result-actions,
  .inventory-modal-actions {
    grid-template-columns: 1fr;
  }

  .history-row {
    grid-template-columns: 1fr;
  }

  .history-statuses {
    max-width: none;
    flex-direction: row;
    align-items: center;
  }
}
</style>
