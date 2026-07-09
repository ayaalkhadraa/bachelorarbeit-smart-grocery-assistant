<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, nextTick, ref } from 'vue'
import { Capacitor } from '@capacitor/core'
import {
  CapacitorBarcodeScanner,
  CapacitorBarcodeScannerAndroidScanningLibrary,
  CapacitorBarcodeScannerTypeHint
} from '@capacitor/barcode-scanner'
import {
  IonAlert,
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonChip,
  IonInput,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonText,
  IonToast,
  IonModal
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
        hint: CapacitorBarcodeScannerTypeHint.ALL,
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
  <main class="p-6 flex flex-col gap-6 pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:pb-7">
    <div class="flex flex-col gap-2">
      <div class="flex flex-wrap items-center gap-3">
        <h1 class="m-0 text-[1.75rem] font-bold">Ionic-Scanner</h1>
      </div>
      <p class="m-0 text-muted-color">Barcode scannen, Ergebnis prüfen und Produkte direkt zu Inventar oder Einkaufsliste hinzufügen.</p>
    </div>

    <IonCard class="m-0">
      <IonCardHeader class="px-4 pt-4 pb-3">
        <IonCardTitle class="text-lg">Scan-Bereich</IonCardTitle>
        <IonCardSubtitle>Auf Android wird der native Barcode-Scanner verwendet. Im Web bleibt die bestehende Simulation aktiv.</IonCardSubtitle>
      </IonCardHeader>
      <IonCardContent class="px-4 pt-0 pb-4">
        <div class="flex flex-col gap-4">
          <div class="scan-preview-box">
            <div class="flex flex-col gap-1">
              <IonText color="medium">
                <p class="m-0 text-xs font-semibold uppercase tracking-[0.12em]">Barcode-Vorschau</p>
              </IonText>
              <h2 class="m-0 text-[1.15rem] font-bold text-color">Halte den Barcode vor die Kamera.</h2>
            </div>

            <div v-if="cameraActive" class="scan-preview-video-wrap">
              <video ref="videoRef" class="camera-preview" autoplay playsinline muted></video>
            </div>
            <div v-else class="scan-preview-placeholder">
              <span class="scan-preview-icon">▣</span>
              <p class="m-0 text-sm text-muted-color">Barcode-Kamera bereit</p>
            </div>

            <IonBadge v-if="isWebSimulation" class="scan-preview-badge soft-status-badge soft-status-badge--neutral">Web-Simulation aktiv</IonBadge>
          </div>

          <IonText v-if="cameraError" color="warning">
            <p class="m-0 text-sm">{{ cameraError }}</p>
          </IonText>

          <IonButton
            expand="block"
            fill="solid"
            color="success"
            class="freshflow-scan-button scan-primary-button"
            :disabled="isScanning"
            @click="startScan"
          >
            Barcode scannen
          </IonButton>
        </div>
      </IonCardContent>
    </IonCard>

    <div v-if="scanCompleted" class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <IonCard class="w-full m-0">
        <IonCardHeader class="px-4 pt-4 pb-3">
          <div class="flex flex-wrap items-center gap-3">
            <IonCardTitle class="text-lg">Erkannter Barcode</IonCardTitle>
            <IonBadge class="soft-status-badge soft-status-badge--success">Scan erfolgreich</IonBadge>
          </div>
        </IonCardHeader>
        <IonCardContent class="px-4 pt-0 pb-4">
          <p class="barcode-value">{{ scannedBarcode }}</p>
        </IonCardContent>
      </IonCard>

      <IonCard class="w-full m-0">
        <IonCardHeader class="px-4 pt-4 pb-3">
          <IonCardTitle class="text-lg">Produktdaten</IonCardTitle>
          <IonCardSubtitle>Produktdaten werden im Web-Prototyp simuliert.</IonCardSubtitle>
        </IonCardHeader>
        <IonCardContent class="px-4 pt-0 pb-4 md:pb-5">
          <template v-if="scannedProduct">
            <div class="product-data-grid">
              <div class="product-data-row">
                <span class="product-data-label">Produkt</span>
                <span class="product-data-value">{{ scannedProduct.name }}</span>
              </div>

              <div class="product-data-row">
                <span class="product-data-label">Kategorie</span>
                <IonChip class="m-0 history-chip history-chip--category">
                  <IonLabel>{{ scannedProduct.category }}</IonLabel>
                </IonChip>
              </div>

              <div v-if="scannedProduct.expiryDate" class="product-data-row">
                <span class="product-data-label">Ablaufdatum</span>
                <span class="product-data-value">{{ scannedProduct.expiryDate }}</span>
                <IonBadge class="soft-status-badge soft-status-badge--neutral">Simuliert</IonBadge>
              </div>
            </div>

            <div class="mt-4 flex flex-col gap-3 sm:flex-row">
              <IonButton class="freshflow-scan-button flex-1" color="success" @click="openAddToInventoryDialog">
                Zum Inventar hinzufügen
              </IonButton>
              <IonButton class="flex-1" fill="outline" color="medium" @click="addScannedProductToShoppingList">
                Zur Einkaufsliste hinzufügen
              </IonButton>
            </div>
          </template>

          <template v-else>
            <IonText color="warning">
              <p class="m-0">Für diesen Barcode wurden keine Produktdaten gefunden.</p>
            </IonText>
            <IonButton class="mt-4" fill="outline" color="medium" @click="resetScan">
              Manuell zurücksetzen
            </IonButton>
          </template>
        </IonCardContent>
      </IonCard>
    </div>

    <IonCard class="m-0">
      <IonCardHeader class="px-4 pt-4 pb-3">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <IonCardTitle class="text-lg">Scan-Historie</IonCardTitle>
          <IonButton
            v-if="scanHistory.length"
            fill="outline"
            color="medium"
            size="small"
            @click="showClearHistoryAlert = true"
          >
            Historie leeren
          </IonButton>
        </div>
      </IonCardHeader>
      <IonCardContent class="px-4 pt-0 pb-4">
        <IonList v-if="scanHistory.length" lines="none" class="bg-transparent p-0">
          <IonItemSliding
            v-for="entry in scanHistory"
            :key="entry.id"
            class="mb-3 overflow-hidden rounded-2xl border border-[var(--sg-border)] bg-[var(--sg-surface)] shadow-sm"
          >
            <IonItem lines="none" class="min-h-[92px] scan-history-item" :detail="false">
              <IonLabel class="ion-text-wrap">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0 flex-1">
                    <h3 class="m-0 text-base font-semibold text-color">{{ entry.productName }}</h3>
                    <p class="m-0 mt-1 text-sm text-muted-color">Barcode: {{ entry.barcode }}</p>
                    <p class="m-0 mt-1 text-sm text-muted-color">Zeit: {{ entry.scannedAt }}</p>
                  </div>

                  <div class="flex shrink-0 flex-col items-end gap-2">
                    <IonChip class="m-0 history-chip history-chip--result">
                      <IonLabel>{{ entry.result }}</IonLabel>
                    </IonChip>
                    <IonChip v-if="entry.target !== 'Noch nicht übernommen'" class="m-0 history-chip history-chip--target">
                      <IonLabel>{{ entry.target }}</IonLabel>
                    </IonChip>
                  </div>
                </div>

                <div class="mt-3 flex flex-wrap gap-2">
                  <IonChip class="m-0 history-chip history-chip--category">
                    <IonLabel>{{ entry.category }}</IonLabel>
                  </IonChip>
                </div>
              </IonLabel>
            </IonItem>

            <IonItemOptions side="start">
              <IonItemOption color="success" @click="addHistoryEntryToInventory(entry)">
                Zum Inventar
              </IonItemOption>
              <IonItemOption color="medium" @click="addHistoryEntryToShoppingList(entry)">
                Einkaufsliste
              </IonItemOption>
            </IonItemOptions>

            <IonItemOptions side="end">
              <IonItemOption color="danger" @click="removeHistoryEntry(entry.id)">
                Löschen
              </IonItemOption>
            </IonItemOptions>
          </IonItemSliding>
        </IonList>

        <IonText v-else color="medium">
          <p class="m-0">Noch keine Scans vorhanden.</p>
        </IonText>
      </IonCardContent>
    </IonCard>

    <IonModal
      :is-open="showAddInventoryModal"
      :initial-breakpoint="0.4"
      :breakpoints="[0, 0.4, 0.72]"
      :handle="true"
      @didDismiss="showAddInventoryModal = false"
    >
      <div class="flex max-h-[86vh] flex-col gap-4 overflow-y-auto p-4 pt-2">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h2 class="m-0 text-lg font-bold text-color">
              {{ scannedProduct ? `${scannedProduct.name} zum Inventar hinzufügen` : 'Zum Inventar hinzufügen' }}
            </h2>
            <p class="m-0 mt-1 text-sm text-muted-color">Menge und optionales Ablaufdatum festlegen.</p>
          </div>

          <IonButton fill="clear" color="medium" size="small" @click="showAddInventoryModal = false">
            Schließen
          </IonButton>
        </div>

        <IonList inset lines="full" class="bg-transparent p-0">
          <IonItem>
            <IonLabel position="stacked">Menge</IonLabel>
            <IonInput v-model="dialogQuantityInput" type="number" inputmode="numeric" min="1" max="999" />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Ablaufdatum <span class="text-muted-color">(optional)</span></IonLabel>
            <IonInput v-model="dialogExpiryDateInput" type="date" />
          </IonItem>
        </IonList>

        <div class="flex gap-3 pt-2">
          <IonButton expand="block" fill="outline" color="medium" class="flex-1" @click="showAddInventoryModal = false">
            Abbrechen
          </IonButton>
          <IonButton expand="block" color="success" class="flex-1" @click="confirmAddToInventory">
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
</template>

<style scoped>
:host {
  --freshflow-green: var(--sg-primary, #16a34a);
  --freshflow-green-strong: #15803d;
  --freshflow-green-soft: rgba(22, 163, 74, 0.12);
}

.scan-preview-box {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding: 1rem;
  border-radius: 1.25rem;
  border: 1px solid var(--sg-border, #d1d5db);
  background: linear-gradient(180deg, var(--p-surface-0, #ffffff) 0%, var(--sg-surface-2, #f8faf9) 100%);
}

.scan-preview-video-wrap {
  overflow: hidden;
  border-radius: 1rem;
}

.scan-preview-placeholder {
  display: flex;
  min-height: 140px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  border-radius: 1rem;
  border: 2px dashed var(--sg-border, #d1d5db);
  background: rgba(22, 163, 74, 0.04);
}

.scan-preview-icon {
  font-size: 2.75rem;
  line-height: 1;
  color: var(--freshflow-green);
}

.scan-preview-badge {
  align-self: flex-start;
}

:deep(.freshflow-scan-button) {
  --background: var(--freshflow-green);
  --background-hover: var(--freshflow-green-strong);
  --background-activated: var(--freshflow-green-strong);
  --color: #ffffff;
  min-height: 56px;
  font-weight: 700;
}

:deep(.scan-primary-button) {
  width: 100%;
}

:deep(.freshflow-scan-button.button-disabled) {
  opacity: 0.85;
}

:deep(.scan-primary-button::part(native)) {
  min-height: 56px;
  font-size: 1rem;
  font-weight: 700;
  justify-content: center;
}

.product-data-grid {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.product-data-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
}

.product-data-label {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--sg-muted, #6b7280);
}

.product-data-value {
  min-width: 0;
  flex: 1;
  text-align: right;
  font-size: 0.98rem;
  font-weight: 600;
  color: var(--sg-text, #1f2937);
}

:deep(ion-badge[color='success']) {
  --background: var(--freshflow-green);
  --color: #ffffff;
}

:deep(.soft-status-badge) {
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: none;
  --padding-start: 0.55rem;
  --padding-end: 0.55rem;
  --padding-top: 0.28rem;
  --padding-bottom: 0.28rem;
}

:deep(.soft-status-badge--success) {
  --background: rgba(22, 163, 74, 0.12);
  --color: var(--freshflow-green-strong);
}

:deep(.soft-status-badge--neutral) {
  --background: rgba(107, 114, 128, 0.12);
  --color: #4b5563;
}

:deep(ion-button[color='success']) {
  --background: var(--freshflow-green);
  --background-hover: var(--freshflow-green-strong);
  --background-activated: var(--freshflow-green-strong);
  --color: #ffffff;
}

:deep(ion-button[color='success'].button-outline) {
  --border-color: var(--freshflow-green);
  --color: var(--freshflow-green);
}

:deep(.history-chip) {
  margin: 0;
  height: auto;
  border-radius: 999px;
  background: var(--p-surface-100, #f3f4f6);
  color: var(--sg-text, #1f2937);
}

:deep(.history-chip ion-label) {
  margin: 0;
  padding: 0;
  font-size: 0.74rem;
  font-weight: 600;
}

:deep(.history-chip--result) {
  background: rgba(22, 163, 74, 0.12);
  color: var(--freshflow-green-strong);
}

:deep(.history-chip--target) {
  background: rgba(37, 99, 235, 0.1);
  color: #1d4ed8;
}

:deep(.history-chip--category) {
  background: rgba(107, 114, 128, 0.12);
  color: #4b5563;
}

:deep(.camera-preview) {
  width: 100%;
  max-height: 260px;
  object-fit: cover;
  border-radius: 12px;
  border: 1px solid var(--sg-border, #d1d5db);
  background: #000;
}

:deep(.scan-history-item) {
  --padding-start: 0.9rem;
  --inner-padding-end: 0.9rem;
  --min-height: 92px;
}

.barcode-value {
  font-family: 'Courier New', Courier, monospace;
  font-size: 1.4rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--p-text-color, #1f2937);
  margin: 0;
  padding: 0.75rem 1rem;
  background-color: var(--p-surface-100, #f3f4f6);
  border-radius: 6px;
  border: 1px solid var(--p-surface-200, #e5e7eb);
  word-break: break-all;
}
</style>