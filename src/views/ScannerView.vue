<script setup lang="ts">
import { ref } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import Message from 'primevue/message'
import { useGroceryStore } from '@/stores/groceryStore'

const groceryStore = useGroceryStore()

const isScanning = ref(false)
const scanFinished = ref(false)
const scannedProductName = ref('')

const simulatedProducts = ['Milch', 'Bananen', 'Joghurt', 'Brot', 'Tomaten']

function startFakeScan() {
  isScanning.value = true
  scanFinished.value = false
  scannedProductName.value = ''

  setTimeout(() => {
    const randomIndex = Math.floor(Math.random() * simulatedProducts.length)
    scannedProductName.value = simulatedProducts[randomIndex]!
    isScanning.value = false
    scanFinished.value = true
  }, 1500)
}

function addScannedProduct() {
  if (!scannedProductName.value) return

  groceryStore.addItem({
    name: scannedProductName.value,
    category: 'Sonstiges',
    quantity: 1,
    unit: 'Stück',
    expiryDate: '',
    location: 'Küche',
    status: 'fresh',
    favorite: false
  })

  scanFinished.value = false
  scannedProductName.value = ''
}

function resetScan() {
  scanFinished.value = false
  scannedProductName.value = ''
}
</script>

<template>
  <main class="scanner-page">
    <div class="scanner-header">
      <h1>Scanner</h1>
      <p>Simulierter Produktscan für den Web-Prototyp.</p>
    </div>

    <Message severity="info" :closable="false">
      Im Web-Prototyp wird die Kamera-Funktion simuliert. Die echte Kamera wird später über Capacitor untersucht.
    </Message>

    <div class="scanner-grid">
      <!-- Card 1: Scan-Bereich -->
      <Card>
        <template #title>Scan-Bereich</template>
        <template #content>
          <div class="camera-placeholder">
            <i class="pi pi-camera camera-icon"></i>
          </div>

          <div class="scan-status">
            <template v-if="isScanning">
              <p>Scan läuft...</p>
              <Tag value="Scanning" severity="warning" />
            </template>
            <template v-else-if="scanFinished">
              <p>Produkt erkannt</p>
              <Tag :value="scannedProductName" severity="success" />
            </template>
            <template v-else>
              <p>Noch kein Scan gestartet.</p>
            </template>
          </div>

          <div class="scan-actions">
            <Button
              label="Scan starten"
              icon="pi pi-camera"
              :disabled="isScanning"
              @click="startFakeScan"
            />
            <Button
              label="Zurücksetzen"
              icon="pi pi-refresh"
              severity="secondary"
              outlined
              @click="resetScan"
            />
          </div>
        </template>
      </Card>

      <!-- Card 2: Erkanntes Produkt -->
      <Card>
        <template #title>Erkanntes Produkt</template>
        <template #content>
          <div class="product-form">
            <InputText
              v-model="scannedProductName"
              placeholder="Produktname"
              class="w-full"
            />
            <small>Der Produktname kann manuell angepasst werden.</small>

            <Button
              label="Zum Inventar hinzufügen"
              icon="pi pi-plus"
              :disabled="!scannedProductName"
              @click="addScannedProduct"
            />

            <p v-if="scanFinished" class="hint-text">
              Das Produkt kann nun zum Inventar hinzugefügt werden.
            </p>
          </div>
        </template>
      </Card>
    </div>
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

.scanner-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.camera-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 160px;
  background-color: var(--p-surface-100, #f3f4f6);
  border: 2px dashed var(--p-surface-300, #d1d5db);
  border-radius: 8px;
  margin-bottom: 1rem;
}

.camera-icon {
  font-size: 3rem;
  color: var(--p-surface-400, #9ca3af);
}

.scan-status {
  min-height: 3rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.scan-status p {
  margin: 0;
}

.scan-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.product-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.product-form small {
  color: var(--p-text-muted-color, #6c757d);
}

.hint-text {
  margin: 0;
  color: var(--p-green-600, #16a34a);
  font-size: 0.875rem;
}

@media (max-width: 900px) {
  .scanner-grid {
    grid-template-columns: 1fr;
  }
}
</style>
