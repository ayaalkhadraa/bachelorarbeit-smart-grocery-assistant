<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { Capacitor } from '@capacitor/core'
import {
  CapacitorBarcodeScanner,
  CapacitorBarcodeScannerAndroidScanningLibrary,
  CapacitorBarcodeScannerTypeHint
} from '@capacitor/barcode-scanner'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Message from 'primevue/message'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import DatePicker from 'primevue/datepicker'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { useGroceryStore } from '@/stores/groceryStore'

const groceryStore = useGroceryStore()

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

const showInventoryDialog = ref(false)
const dialogQuantity = ref(1)
const dialogExpiryDate = ref<Date | null>(null)

type MessageSeverity = 'success' | 'warn' | 'info' | 'error'
const feedbackMessage = ref('')
const feedbackSeverity = ref<MessageSeverity>('success')
const showFeedback = ref(false)

const cameraActive = ref(false)
const cameraError = ref('')
const videoRef = ref<HTMLVideoElement | null>(null)
let cameraStream: MediaStream | null = null

const SCAN_HISTORY_KEY = 'freshflow-scan-history'
const scanHistory = ref<ScanHistoryEntry[]>([])

function loadScanHistory() {
  try {
    const raw = localStorage.getItem(SCAN_HISTORY_KEY)
    if (raw) {
      scanHistory.value = JSON.parse(raw) as ScanHistoryEntry[]
    }
  } catch {
    scanHistory.value = []
  }
}

function saveScanHistory() {
  localStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(scanHistory.value))
}

onMounted(() => {
  loadScanHistory()
})

onBeforeUnmount(() => {
  stopCamera()
})

async function startCamera() {
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
        cameraError.value = 'Kamera-Zugriff verweigert. Klicke auf das Schloss-Symbol in der Adressleiste des Browsers → „Kamera" → „Erlauben", dann die Seite neu laden.'
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

function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop())
    cameraStream = null
  }

  cameraActive.value = false

  if (videoRef.value) {
    videoRef.value.srcObject = null
  }
}

const simulatedProducts: SimulatedProduct[] = [
  { barcode: '4006381333931', name: 'Vollmilch 3,5%', category: 'Milchprodukte', expiryDate: '2026-06-25' },
  { barcode: '4000539011009', name: 'Bananen', category: 'Obst & Gemüse' },
  { barcode: '4008117801220', name: 'Naturjoghurt', category: 'Milchprodukte', expiryDate: '2026-06-22' },
  { barcode: '4009233133956', name: 'Vollkornbrot', category: 'Backwaren', expiryDate: '2026-06-18' },
  { barcode: '4056489123456', name: 'Rispentomaten', category: 'Obst & Gemüse' },
]

const UNKNOWN_BARCODE = '9999999999999'

function handleScanResult(barcode: string) {
  scannedBarcode.value = barcode
  scannedProduct.value = simulatedProducts.find((item) => item.barcode === barcode) ?? null
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

async function startScan() {
  isScanning.value = true
  scanCompleted.value = false
  scannedBarcode.value = ''
  scannedProduct.value = null
  showFeedback.value = false
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

function updateHistoryTarget(barcode: string, target: 'Inventar' | 'Einkaufsliste') {
  const entry = scanHistory.value.find(
    (item) => item.barcode === barcode && item.target === 'Noch nicht übernommen'
  )
  if (entry) {
    entry.target = target
    saveScanHistory()
  }
}

function openAddToInventoryDialog() {
  if (!scannedProduct.value) return
  dialogQuantity.value = 1
  dialogExpiryDate.value = scannedProduct.value.expiryDate
    ? new Date(scannedProduct.value.expiryDate)
    : null
  showInventoryDialog.value = true
}

function confirmAddToInventory() {
  if (!scannedProduct.value) return

  const expiryDateStr = dialogExpiryDate.value
    ? dialogExpiryDate.value.toISOString().split('T')[0]!
    : ''

  const existing = groceryStore.items.find(
    (item) => item.barcode === scannedBarcode.value && !item.inShoppingList
  )
  if (existing) {
    showInventoryDialog.value = false
    setFeedback('warn', `„${scannedProduct.value.name}" ist bereits im Inventar vorhanden.`)
    return
  }

  groceryStore.addItem({
    name: scannedProduct.value.name,
    category: scannedProduct.value.category,
    quantity: dialogQuantity.value,
    unit: 'Stück',
    expiryDate: expiryDateStr,
    location: 'Küche',
    favorite: false,
    inShoppingList: false,
    bought: false,
    barcode: scannedBarcode.value
  })

  updateHistoryTarget(scannedBarcode.value, 'Inventar')
  showInventoryDialog.value = false
  setFeedback('success', 'Produkt wurde dem Inventar hinzugefügt.')
  resetScan()
}

function addScannedProductToShoppingList() {
  if (!scannedProduct.value) return

  const existing = groceryStore.items.find(
    (item) => item.barcode === scannedBarcode.value && item.inShoppingList
  )
  if (existing) {
    setFeedback('warn', `„${scannedProduct.value.name}" ist bereits in der Einkaufsliste.`)
    return
  }

  groceryStore.addItem({
    name: scannedProduct.value.name,
    category: scannedProduct.value.category,
    quantity: 1,
    unit: 'Stück',
    expiryDate: '',
    location: '',
    favorite: false,
    inShoppingList: true,
    bought: false,
    barcode: scannedBarcode.value
  })

  updateHistoryTarget(scannedBarcode.value, 'Einkaufsliste')
  setFeedback('success', 'Produkt wurde zur Einkaufsliste hinzugefügt.')
  resetScan()
}

function setFeedback(severity: MessageSeverity, message: string) {
  feedbackSeverity.value = severity
  feedbackMessage.value = message
  showFeedback.value = true
}

function resetScan() {
  isScanning.value = false
  scanCompleted.value = false
  scannedBarcode.value = ''
  scannedProduct.value = null
}

function clearScanHistory() {
  scanHistory.value = []
  saveScanHistory()
}
</script>

<template>
  <main class="p-6 flex flex-col gap-6">
    <div>
      <h1 class="m-0 mb-1 text-[1.75rem] font-bold">Scanner</h1>
      <p class="m-0 text-muted-color">Produkte per Barcode erfassen und zum Inventar hinzufügen.</p>
    </div>

    <!-- Scan-Bereich -->
    <Card>
      <template #title>Scan-Bereich</template>
      <template #content>
        <div class="flex flex-col gap-4">
          <div v-if="!cameraActive" class="flex items-center justify-center w-full h-[140px] bg-surface-50 border-2 border-dashed border-surface rounded-lg">
            <i class="pi pi-barcode text-[3rem] text-muted-color"></i>
          </div>

          <video v-if="cameraActive" ref="videoRef" class="camera-preview" autoplay playsinline muted></video>

          <p class="m-0 text-sm text-muted-color leading-relaxed">
            Auf Android wird der native Barcode-Scanner verwendet. Im Web bleibt die bestehende Simulation aktiv.
          </p>

          <Message v-if="cameraError" severity="warn" :closable="false">{{ cameraError }}</Message>

          <div class="flex flex-wrap gap-3">
            <Button
              :label="isScanning ? 'Barcode wird gescannt...' : scanCompleted ? 'Erneut scannen' : 'Scan starten'"
              icon="pi pi-barcode"
              :loading="isScanning"
              :disabled="isScanning"
              @click="startScan"
            />
            <Button
              v-if="scanCompleted"
              label="Zurücksetzen"
              icon="pi pi-refresh"
              severity="secondary"
              outlined
              @click="resetScan"
            />
          </div>

          <div class="flex flex-wrap gap-3">
            <Button
              v-if="!cameraActive"
              label="Kamera öffnen"
              icon="pi pi-camera"
              severity="secondary"
              outlined
              @click="startCamera"
            />
            <Button
              v-if="cameraActive"
              label="Kamera schließen"
              icon="pi pi-times"
              severity="secondary"
              outlined
              @click="stopCamera"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- Ergebnis nach Scan -->
    <div v-if="scanCompleted" class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Bereich A: Erkannter Barcode -->
      <Card class="w-full result-section">
        <template #title>
          <div class="flex items-center gap-3 flex-wrap">
            Erkannter Barcode
            <Tag value="Scan erfolgreich" severity="success" />
          </div>
        </template>
        <template #content>
          <p class="barcode-value">{{ scannedBarcode }}</p>
        </template>
      </Card>

      <!-- Bereich B: Produktdaten -->
      <Card class="w-full result-section">
        <template #title>Produktdaten</template>
        <template #content>
          <p class="m-0 mb-4 text-sm text-muted-color">Produktdaten werden im Web-Prototyp simuliert.</p>

          <template v-if="scannedProduct">
            <div class="flex flex-col gap-3 mb-2">
              <div class="flex justify-between gap-2">
                <span class="text-sm text-muted-color">Produkt</span>
                <span class="font-medium text-right">{{ scannedProduct.name }}</span>
              </div>
              <div class="flex justify-between gap-2">
                <span class="text-sm text-muted-color">Kategorie</span>
                <span class="font-medium text-right">{{ scannedProduct.category }}</span>
              </div>
              <div v-if="scannedProduct.expiryDate" class="flex justify-between gap-2">
                <span class="text-sm text-muted-color">Ablaufdatum</span>
                <span class="font-medium text-right">{{ scannedProduct.expiryDate }}</span>
              </div>
            </div>
            <div class="flex flex-wrap gap-3 mt-3">
              <Button
                label="Zum Inventar hinzufügen"
                icon="pi pi-box"
                @click="openAddToInventoryDialog"
              />
              <Button
                label="Zur Einkaufsliste hinzufügen"
                icon="pi pi-shopping-cart"
                severity="secondary"
                outlined
                @click="addScannedProductToShoppingList"
              />
            </div>
          </template>

          <template v-else>
            <Message severity="warn" :closable="false">
              Für diesen Barcode wurden keine Produktdaten gefunden.
            </Message>
            <Button
              label="Manuell hinzufügen"
              icon="pi pi-pencil"
              severity="secondary"
              class="mt-3"
              @click="resetScan"
            />
          </template>
        </template>
      </Card>
    </div>

    <!-- Feedback Message -->
    <Message v-if="showFeedback" :severity="feedbackSeverity" :closable="true" @close="showFeedback = false">
      {{ feedbackMessage }}
    </Message>

    <!-- Scan-Historie -->
    <Card class="scan-history-card">
      <template #title>Scan-Historie</template>
      <template #content>
        <DataTable
          :value="scanHistory"
          responsiveLayout="scroll"
          stripedRows
          size="small"
          emptyMessage="Noch keine Scans vorhanden."
        >
          <Column field="scannedAt" header="Zeit" />
          <Column field="barcode" header="Barcode" />
          <Column field="productName" header="Produkt" />
          <Column field="category" header="Kategorie" />
          <Column field="result" header="Ergebnis">
            <template #body="{ data }">
              <Tag
                :value="data.result"
                :severity="data.result === 'Gefunden' ? 'success' : 'warn'"
              />
            </template>
          </Column>
          <Column field="target" header="Übernommen in">
            <template #body="{ data }">
              <Tag
                :value="data.target"
                :severity="
                  data.target === 'Inventar'
                    ? 'success'
                    : data.target === 'Einkaufsliste'
                      ? 'info'
                      : 'secondary'
                "
              />
            </template>
          </Column>
        </DataTable>

        <div v-if="scanHistory.length" class="flex justify-end mt-4">
          <Button
            label="Historie leeren"
            icon="pi pi-trash"
            severity="secondary"
            outlined
            size="small"
            class="mt-3"
            @click="clearScanHistory"
          />
        </div>
      </template>
    </Card>

    <!-- Dialog: Zum Inventar hinzufügen -->
    <Dialog
      v-model:visible="showInventoryDialog"
      :header="scannedProduct ? `${scannedProduct.name} zum Inventar hinzufügen` : 'Zum Inventar hinzufügen'"
      :modal="true"
      :style="{ width: '22rem' }"
    >
      <div class="flex flex-col gap-4 py-2">
        <label class="text-sm font-medium text-color">Menge</label>
        <InputNumber v-model="dialogQuantity" :min="1" :max="999" showButtons class="w-full" />

        <label class="text-sm font-medium text-color">Ablaufdatum <span class="font-normal text-muted-color">(optional)</span></label>
        <DatePicker
          v-model="dialogExpiryDate"
          dateFormat="dd.mm.yy"
          placeholder="TT.MM.JJJJ"
          showButtonBar
          class="w-full"
        />
      </div>

      <template #footer>
        <Button label="Abbrechen" severity="secondary" outlined @click="showInventoryDialog = false" />
        <Button label="Hinzufügen" icon="pi pi-box" @click="confirmAddToInventory" />
      </template>
    </Dialog>
  </main>
</template>

<style scoped>
/* ── Barcode value: monospace font kept intentionally ───── */
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

/* ── Camera preview: complex video styling kept ─────────── */
.camera-preview {
  width: 100%;
  max-height: 260px;
  object-fit: cover;
  border-radius: 12px;
  border: 1px solid var(--p-surface-300, #d1d5db);
  background: #000;
}
</style>
