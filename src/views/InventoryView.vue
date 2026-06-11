<script setup lang="ts">
import { computed, ref } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import InputNumber from 'primevue/inputnumber'
import DatePicker from 'primevue/datepicker'
import Message from 'primevue/message'
import Divider from 'primevue/divider'

import { useGroceryStore } from '@/stores/groceryStore'

const groceryStore = useGroceryStore()

const searchTerm = ref('')
const showAddDialog = ref(false)
const showScanMessage = ref(false)

const categories = [
  'Obst',
  'Gemüse',
  'Milchprodukte',
  'Getränke',
  'Backwaren',
  'Sonstiges'
]

const locations = [
  'Kühlschrank',
  'Küche',
  'Vorratsschrank',
  'Gefrierfach'
]

const newItem = ref({
  name: '' as string,
  category: 'Sonstiges' as string,
  quantity: 1 as number,
  unit: 'Stück' as string,
  expiryDate: null as Date | null,
  location: 'Küche' as string,
  status: 'fresh' as 'fresh' | 'soon' | 'critical',
  favorite: false as boolean,
  barcode: '' as string
})

const formatDateForStorage = (value: Date | string | null | undefined): string => {
  if (!value) return ''
  if (value instanceof Date) {
    const y = value.getFullYear()
    const m = String(value.getMonth() + 1).padStart(2, '0')
    const d = String(value.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  return value
}

const filteredItems = computed(() => {
  return groceryStore.items.filter((item) => {
    return (
      item.name.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.value.toLowerCase())
    )
  })
})

const getStatusLabel = (status: string) => {
  if (status === 'fresh') return 'Frisch'
  if (status === 'soon') return 'Läuft bald ab'
  if (status === 'critical') return 'Abgelaufen'
  return 'Unbekannt'
}

const getStatusSeverity = (status: string) => {
  if (status === 'fresh') return 'success'
  if (status === 'soon') return 'warning'
  if (status === 'critical') return 'danger'
  return 'secondary'
}

const resetNewItem = () => {
  newItem.value = {
    name: '',
    category: 'Sonstiges',
    quantity: 1,
    unit: 'Stück',
    expiryDate: null,
    location: 'Küche',
    status: 'fresh',
    favorite: false,
    barcode: ''
  }
  showScanMessage.value = false
}

const simulateBarcodeScan = () => {
  newItem.value.barcode = '4008400401620'
  if (!newItem.value.name.trim()) {
    newItem.value.name = 'Gescanntes Produkt'
  }
  showScanMessage.value = true
}

const addNewItem = () => {
  if (!newItem.value.name.trim()) return

  groceryStore.addItem({
    name: newItem.value.name,
    category: newItem.value.category,
    quantity: newItem.value.quantity,
    unit: newItem.value.unit,
    expiryDate: formatDateForStorage(newItem.value.expiryDate),
    location: newItem.value.location,
    status: newItem.value.status,
    favorite: newItem.value.favorite,
    barcode: newItem.value.barcode
  })

  resetNewItem()
  showAddDialog.value = false
}
</script>

<template>
  <main class="inventory-page">
    <section class="page-header">
      <div>
        <h1>Inventar</h1>
        <p>Alle gespeicherten Lebensmittel im Überblick.</p>
      </div>

      <Button
  label="Neues Produkt"
  icon="pi pi-plus"
  @click="showAddDialog = true"
/>
    </section>

    <section class="search-section">
      <IconField class="search-box">
       <InputIcon class="pi pi-search" />
       <InputText v-model="searchTerm" placeholder="Nach Name oder Kategorie suchen..." />
       </IconField>
    </section>

    <section class="items-grid">
      <Card v-for="item in filteredItems" :key="item.id" class="item-card">
        <template #title>
          <div class="card-title">
            <span>{{ item.name }}</span>

            <Button
              text
              rounded
              :icon="item.favorite ? 'pi pi-star-fill' : 'pi pi-star'"
              @click="groceryStore.toggleFavorite(item.id)"
            />
          </div>
        </template>

        <template #subtitle>
          {{ item.category }}
        </template>

        <template #content>
          <div class="item-content">
            <Tag
              :value="getStatusLabel(item.status)"
              :severity="getStatusSeverity(item.status)"
            />

            <p>
              <strong>Menge:</strong>
              {{ item.quantity }} {{ item.unit }}
            </p>

            <p>
              <strong>Ablaufdatum:</strong>
              {{ item.expiryDate }}
            </p>

            <p>
              <strong>Ort:</strong>
              {{ item.location }}
            </p>
          </div>
        </template>

        <template #footer>
          <div class="card-actions">
            <Button
              label="-"
              severity="secondary"
              outlined
              @click="groceryStore.updateQuantity(item.id, Math.max(0, item.quantity - 1))"
            />

            <Button
              label="+"
              severity="secondary"
              outlined
              @click="groceryStore.updateQuantity(item.id, item.quantity + 1)"
            />

            <Button
              icon="pi pi-trash"
              severity="danger"
              outlined
              @click="groceryStore.deleteItem(item.id)"
            />

            <template v-if="!item.inShoppingList">
              <Button
                label="Zur Liste"
                icon="pi pi-shopping-cart"
                severity="success"
                outlined
                @click="groceryStore.addToShoppingList(item.id)"
              />
            </template>

            <template v-else>
              <Button
                label="In Liste"
                icon="pi pi-check"
                severity="success"
                disabled
              />
              <Button
                label="Entfernen"
                icon="pi pi-times"
                severity="secondary"
                text
                @click="groceryStore.removeFromShoppingList(item.id)"
              />
            </template>
          </div>
        </template>
      </Card>
    </section>

    <p v-if="filteredItems.length === 0" class="empty-message">
      Keine Lebensmittel gefunden.
    </p>

    <Dialog
      v-model:visible="showAddDialog"
      modal
      header="Neues Produkt hinzufügen"
      :style="{ width: '32rem' }"
      :breakpoints="{ '640px': '95vw' }"
    >
      <div class="form-grid">

        <!-- 1. Produktdaten -->
        <div class="form-section">
          <p class="form-section-title">Produktdaten</p>
          <div class="form-field">
            <label for="new-name">Name</label>
            <InputText id="new-name" v-model="newItem.name" placeholder="z. B. Milch" />
          </div>
          <div class="form-field">
            <label for="new-category">Kategorie</label>
            <Dropdown
              id="new-category"
              v-model="newItem.category"
              :options="categories"
              placeholder="Kategorie wählen"
            />
          </div>
        </div>

        <Divider />

        <!-- 2. Menge und Ablaufdatum -->
        <div class="form-section">
          <p class="form-section-title">Menge &amp; Ablaufdatum</p>
          <div class="form-field">
            <label for="new-quantity">Menge</label>
            <InputNumber
              id="new-quantity"
              v-model="newItem.quantity"
              :min="1"
              showButtons
              buttonLayout="horizontal"
              decrementButtonIcon="pi pi-minus"
              incrementButtonIcon="pi pi-plus"
            />
          </div>
          <div class="form-field">
            <label for="new-unit">Einheit</label>
            <InputText id="new-unit" v-model="newItem.unit" placeholder="z. B. Stück" />
          </div>
          <div class="form-field">
            <label for="new-expiry">Ablaufdatum</label>
            <DatePicker
              id="new-expiry"
              v-model="newItem.expiryDate"
              showIcon
              dateFormat="yy-mm-dd"
              placeholder="Ablaufdatum auswählen"
            />
          </div>
        </div>

        <Divider />

        <!-- 3. Barcode -->
        <div class="form-section">
          <p class="form-section-title">Barcode</p>
          <div class="form-field">
            <label for="new-barcode">Barcode</label>
            <div class="barcode-row">
              <InputText
                id="new-barcode"
                v-model="newItem.barcode"
                placeholder="Barcode manuell eingeben"
              />
              <Button
                icon="pi pi-barcode"
                label="Scannen"
                severity="secondary"
                outlined
                @click="simulateBarcodeScan"
              />
            </div>
          </div>
          <Message v-if="showScanMessage" severity="info" class="scan-message">
            Der Barcode-Scan wird im Web-Prototyp simuliert. In der mobilen Variante kann er
            später über Capacitor umgesetzt werden.
          </Message>
        </div>

        <Divider />

        <!-- 4. Lagerort -->
        <div class="form-section">
          <p class="form-section-title">Lagerort</p>
          <div class="form-field">
            <label for="new-location">Ort</label>
            <Dropdown
              id="new-location"
              v-model="newItem.location"
              :options="locations"
              placeholder="Ort wählen"
            />
          </div>
        </div>

      </div>

      <template #footer>
        <Button
          label="Abbrechen"
          severity="secondary"
          outlined
          @click="showAddDialog = false"
        />
        <Button
          label="Speichern"
          icon="pi pi-check"
          @click="addNewItem"
        />
      </template>
    </Dialog>
  </main>
</template>

<style scoped>
.inventory-page {
  width: 100%;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.page-header h1 {
  margin: 0;
  font-size: 2rem;
  color: #111827;
}

.page-header p {
  margin: 0.4rem 0 0;
  color: #6b7280;
}

.search-section {
  margin-bottom: 1.5rem;
}

.search-box {
  width: 100%;
   max-width: 500px;
}

.search-box input {
  width: 100%;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.item-card {
  height: 100%;
}

.card-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.item-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.item-content p {
  margin: 0;
}

.card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: flex-end;
}

.empty-message {
  margin-top: 2rem;
  text-align: center;
  color: #6b7280;
}

@media (max-width: 1000px) {
  .items-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 650px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .items-grid {
    grid-template-columns: 1fr;
  }
}

.form-grid {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.25rem 0;
}

.form-section-title {
  margin: 0 0 0.25rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--sg-muted, #6b7280);
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-field label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--sg-text, #374151);
}

/* Full-width inputs */
.form-field :deep(input),
.form-field :deep(.p-inputtext),
.form-field :deep(.p-dropdown),
.form-field :deep(.p-select),
.form-field :deep(.p-datepicker),
.form-field :deep(.p-datepicker-input),
.form-field :deep(.p-inputnumber),
.form-field :deep(.p-inputnumber-input) {
  width: 100%;
}

/* Barcode row: input + button side by side */
.barcode-row {
  display: flex;
  gap: 0.5rem;
  align-items: stretch;
}

.barcode-row :deep(.p-inputtext) {
  flex: 1;
  width: auto;
}

.scan-message {
  margin-top: 0.25rem;
}

/* Mobile: stack barcode row */
@media (max-width: 640px) {
  .barcode-row {
    flex-direction: column;
  }

  .barcode-row :deep(.p-inputtext) {
    width: 100%;
  }
}
</style>