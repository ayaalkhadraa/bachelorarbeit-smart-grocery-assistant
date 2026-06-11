<script setup lang="ts">
import { ref } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Message from 'primevue/message'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import DatePicker from 'primevue/datepicker'
import { useGroceryStore } from '@/stores/groceryStore'

const groceryStore = useGroceryStore()

interface SimulatedProduct {
  barcode: string
  name: string
  category: string
  expiryDate?: string
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

const simulatedProducts: SimulatedProduct[] = [
  { barcode: '4006381333931', name: 'Vollmilch 3,5%', category: 'Milchprodukte', expiryDate: '2026-06-25' },
  { barcode: '4000539011009', name: 'Bananen', category: 'Obst & Gemüse' },
  { barcode: '4008117801220', name: 'Naturjoghurt', category: 'Milchprodukte', expiryDate: '2026-06-22' },
  { barcode: '4009233133956', name: 'Vollkornbrot', category: 'Backwaren', expiryDate: '2026-06-18' },
  { barcode: '4056489123456', name: 'Rispentomaten', category: 'Obst & Gemüse' },
]

const UNKNOWN_BARCODE = '9999999999999'

function startFakeScan() {
  isScanning.value = true
  scanCompleted.value = false
  scannedBarcode.value = ''
  scannedProduct.value = null
  showFeedback.value = false

  setTimeout(() => {
    const roll = Math.random()
    if (roll < 0.15) {
      scannedBarcode.value = UNKNOWN_BARCODE
      scannedProduct.value = null
    } else {
      const randomIndex = Math.floor(Math.random() * simulatedProducts.length)
      const found = simulatedProducts[randomIndex]!
      scannedBarcode.value = found.barcode
      scannedProduct.value = found
    }
    isScanning.value = false
    scanCompleted.value = true
  }, 1500)
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

  // Deduplicate: if barcode already exists in inventory, skip
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

  showInventoryDialog.value = false
  setFeedback('success', 'Produkt wurde dem Inventar hinzugefügt.')
  resetScan()
}

function addScannedProductToShoppingList() {
  if (!scannedProduct.value) return

  // Deduplicate: if barcode already in shopping list, skip
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
</script>

<template>
  <main class="scanner-page">
    <div class="scanner-header">
      <h1>Scanner</h1>
      <p>Produkte per Barcode erfassen und zum Inventar hinzufügen.</p>
    </div>

    <!-- Scan-Bereich -->
    <Card>
      <template #title>Scan-Bereich</template>
      <template #content>
        <div class="scan-area">
          <div class="scan-placeholder">
            <i class="pi pi-barcode scan-icon"></i>
          </div>

          <p class="scan-hint">
            Der Scan erfasst zunächst den Barcode. Produktinformationen können anschließend gesucht oder manuell ergänzt werden.
          </p>

          <div class="scan-actions">
            <Button
              :label="isScanning ? 'Barcode wird gescannt...' : scanCompleted ? 'Erneut scannen' : 'Scan starten'"
              icon="pi pi-barcode"
              :loading="isScanning"
              :disabled="isScanning"
              @click="startFakeScan"
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
        </div>
      </template>
    </Card>

    <!-- Ergebnis nach Scan -->
    <div v-if="scanCompleted" class="scanner-result">
      <!-- Bereich A: Erkannter Barcode -->
      <Card class="barcode-card result-section">
        <template #title>
          <div class="result-title">
            Erkannter Barcode
            <Tag value="Scan erfolgreich" severity="success" />
          </div>
        </template>
        <template #content>
          <p class="barcode-value">{{ scannedBarcode }}</p>
        </template>
      </Card>

      <!-- Bereich B: Produktdaten -->
      <Card class="product-data-card result-section">
        <template #title>Produktdaten</template>
        <template #content>
          <p class="simulation-note">Produktdaten werden im Web-Prototyp simuliert.</p>

          <template v-if="scannedProduct">
            <div class="product-details">
              <div class="product-detail-row">
                <span class="detail-label">Produkt</span>
                <span class="detail-value">{{ scannedProduct.name }}</span>
              </div>
              <div class="product-detail-row">
                <span class="detail-label">Kategorie</span>
                <span class="detail-value">{{ scannedProduct.category }}</span>
              </div>
              <div v-if="scannedProduct.expiryDate" class="product-detail-row">
                <span class="detail-label">Ablaufdatum</span>
                <span class="detail-value">{{ scannedProduct.expiryDate }}</span>
              </div>
            </div>
            <div class="action-buttons">
              <Button
                label="Zum Inventar hinzufügen"
                icon="pi pi-box"
                class="mt-3"
                @click="openAddToInventoryDialog"
              />
              <Button
                label="Zur Einkaufsliste hinzufügen"
                icon="pi pi-shopping-cart"
                severity="secondary"
                outlined
                class="mt-3"
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

    <!-- Dialog: Zum Inventar hinzufügen -->
    <Dialog
      v-model:visible="showInventoryDialog"
      :header="scannedProduct ? `${scannedProduct.name} zum Inventar hinzufügen` : 'Zum Inventar hinzufügen'"
      :modal="true"
      :style="{ width: '22rem' }"
    >
      <div class="dialog-form">
        <label class="dialog-label">Menge</label>
        <InputNumber v-model="dialogQuantity" :min="1" :max="999" showButtons class="w-full" />

        <label class="dialog-label">Ablaufdatum <span class="optional-hint">(optional)</span></label>
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
.scanner-page {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.scanner-header h1 {
  margin: 0 0 0.25rem 0;
  font-size: 1.75rem;
}

.scanner-header p {
  margin: 0;
  color: var(--p-text-muted-color, #6c757d);
}

.scan-area {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.scan-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 140px;
  background-color: var(--p-surface-100, #f3f4f6);
  border: 2px dashed var(--p-surface-300, #d1d5db);
  border-radius: 8px;
}

.scan-icon {
  font-size: 3rem;
  color: var(--p-surface-400, #9ca3af);
}

.scan-hint {
  margin: 0;
  font-size: 0.875rem;
  color: var(--p-text-muted-color, #6c757d);
  line-height: 1.5;
}

.scan-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.scanner-result {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.result-section {
  width: 100%;
}

.result-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
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

.simulation-note {
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
  color: var(--p-text-muted-color, #6c757d);
}

.product-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.product-detail-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 0.4rem 0;
  border-bottom: 1px solid var(--p-surface-200, #e5e7eb);
  gap: 1rem;
}

.product-detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  font-size: 0.875rem;
  color: var(--p-text-muted-color, #6c757d);
  white-space: nowrap;
}

.detail-value {
  font-weight: 500;
  text-align: right;
}

.mt-3 {
  margin-top: 1rem;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.dialog-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.5rem 0;
}

.dialog-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--p-text-color, #1f2937);
}

.optional-hint {
  font-weight: 400;
  color: var(--p-text-muted-color, #6c757d);
}

.w-full {
  width: 100%;
}

@media (max-width: 640px) {
  .scanner-result {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    flex-direction: column;
  }
}
</style>
