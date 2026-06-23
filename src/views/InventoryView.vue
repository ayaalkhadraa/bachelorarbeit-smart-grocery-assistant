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
import type { GroceryItem } from '@/stores/groceryStore'
import { getExpiryInfo, getProductExpiryDate } from '@/utils/expiryUtils'
import type { ExpiryInfo } from '@/utils/expiryUtils'

const groceryStore = useGroceryStore()

/** Returns ExpiryInfo for any item, resolving the date field via getProductExpiryDate. */
function itemExpiryInfo(item: GroceryItem): ExpiryInfo {
  return getExpiryInfo(getProductExpiryDate(item as Record<string, unknown>))
}

const searchTerm = ref('')
const showAddDialog = ref(false)
const showScanMessage = ref(false)

const showEditDialog = ref(false)
const editingItem = ref<GroceryItem | null>(null)

const editForm = ref({
  id: 0 as number,
  name: '' as string,
  category: 'Sonstiges' as string,
  quantity: 1 as number,
  unit: 'Stück' as string,
  expiryDate: null as Date | null,
  location: 'Küche' as string,
  barcode: '' as string
})

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

function openEditDialog(item: GroceryItem) {
  editingItem.value = item
  editForm.value = {
    id: item.id,
    name: item.name,
    category: item.category,
    quantity: item.quantity,
    unit: item.unit,
    expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
    location: item.location,
    barcode: item.barcode ?? ''
  }
  showEditDialog.value = true
}

function closeEditDialog() {
  showEditDialog.value = false
  editingItem.value = null
}

function saveEditedItem() {
  if (!editingItem.value || !editForm.value.name.trim() || !editForm.value.expiryDate) return

  groceryStore.updateItem({
    ...editingItem.value,
    name: editForm.value.name,
    category: editForm.value.category,
    quantity: editForm.value.quantity,
    unit: editForm.value.unit,
    expiryDate: editForm.value.expiryDate?.toISOString().split('T')[0] ?? '',
    location: editForm.value.location,
    barcode: editForm.value.barcode,
    status: editingItem.value.status
  })

  closeEditDialog()
}
</script>

<template>
  <main class="w-full">
    <section class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="m-0 text-4xl font-bold text-color">Inventar</h1>
        <p class="m-0 mt-1 text-muted-color">Alle gespeicherten Lebensmittel im Überblick.</p>
      </div>

      <Button
  label="Neues Produkt"
  icon="pi pi-plus"
  @click="showAddDialog = true"
/>
    </section>

    <section class="mb-6">
      <IconField class="w-full max-w-[500px]">
       <InputIcon class="pi pi-search" />
       <InputText v-model="searchTerm" placeholder="Nach Name oder Kategorie suchen..." />
       </IconField>
    </section>

    <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card v-for="item in filteredItems" :key="item.id" class="h-full">
        <template #title>
          <div class="flex justify-between items-center">
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
          <div class="flex flex-col gap-2">
            <Tag
              :value="itemExpiryInfo(item).label"
              :severity="itemExpiryInfo(item).severity"
            />

            <p class="m-0">
              <strong>Menge:</strong>
              {{ item.quantity }} {{ item.unit }}
            </p>

            <p class="m-0">
              <strong>Ablaufdatum:</strong>
              {{ item.expiryDate }}
            </p>

            <p class="m-0">
              <strong>Ort:</strong>
              {{ item.location }}
            </p>
          </div>
        </template>

        <template #footer>
          <div class="flex flex-wrap gap-2 justify-end">
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
              icon="pi pi-pencil"
              severity="secondary"
              outlined
              aria-label="Bearbeiten"
              @click="openEditDialog(item)"
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

    <p v-if="filteredItems.length === 0" class="mt-8 text-center text-muted-color">
      Keine Lebensmittel gefunden.
    </p>

    <Dialog
      v-model:visible="showAddDialog"
      modal
      header="Neues Produkt hinzufügen"
      :style="{ width: '32rem' }"
      :breakpoints="{ '640px': '95vw' }"
    >
      <div class="flex flex-col">

        <!-- 1. Produktdaten -->
        <div class="form-section flex flex-col gap-3 py-1">
          <p class="m-0 mb-1 text-[0.75rem] font-bold uppercase tracking-[0.07em] text-muted-color">Produktdaten</p>
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
        <div class="form-section flex flex-col gap-3 py-1">
          <p class="m-0 mb-1 text-[0.75rem] font-bold uppercase tracking-[0.07em] text-muted-color">Menge &amp; Ablaufdatum</p>
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
        <div class="form-section flex flex-col gap-3 py-1">
          <p class="m-0 mb-1 text-[0.75rem] font-bold uppercase tracking-[0.07em] text-muted-color">Barcode</p>
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
          <Message v-if="showScanMessage" severity="info" class="mt-1">
            Der Barcode-Scan wird im Web-Prototyp simuliert. In der mobilen Variante kann er
            später über Capacitor umgesetzt werden.
          </Message>
        </div>

        <Divider />

        <!-- 4. Lagerort -->
        <div class="form-section flex flex-col gap-3 py-1">
          <p class="m-0 mb-1 text-[0.75rem] font-bold uppercase tracking-[0.07em] text-muted-color">Lagerort</p>
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

    <!-- Edit Dialog -->
    <Dialog
      v-model:visible="showEditDialog"
      modal
      header="Produkt bearbeiten"
      :style="{ width: '32rem' }"
      :breakpoints="{ '640px': '90vw' }"
      @hide="closeEditDialog"
    >
      <div class="flex flex-col gap-3">
        <div class="flex flex-col">

          <!-- Produktdaten -->
          <div class="form-section flex flex-col gap-3 py-1">
            <p class="m-0 mb-1 text-[0.75rem] font-bold uppercase tracking-[0.07em] text-muted-color">Produktdaten</p>
            <div class="form-field">
              <label for="edit-name">Name</label>
              <InputText id="edit-name" v-model="editForm.name" placeholder="z. B. Milch" />
            </div>
            <div class="form-field">
              <label for="edit-category">Kategorie</label>
              <Dropdown
                id="edit-category"
                v-model="editForm.category"
                :options="categories"
                placeholder="Kategorie wählen"
              />
            </div>
          </div>

          <Divider />

          <!-- Menge & Ablaufdatum -->
          <div class="form-section flex flex-col gap-3 py-1">
            <p class="m-0 mb-1 text-[0.75rem] font-bold uppercase tracking-[0.07em] text-muted-color">Menge &amp; Ablaufdatum</p>
            <div class="form-field">
              <label for="edit-quantity">Menge</label>
              <InputNumber
                id="edit-quantity"
                v-model="editForm.quantity"
                :min="0"
                showButtons
                buttonLayout="horizontal"
                decrementButtonIcon="pi pi-minus"
                incrementButtonIcon="pi pi-plus"
              />
            </div>
            <div class="form-field">
              <label for="edit-unit">Einheit</label>
              <InputText id="edit-unit" v-model="editForm.unit" placeholder="z. B. Stück" />
            </div>
            <div class="form-field">
              <label for="edit-expiry">Ablaufdatum</label>
              <DatePicker
                id="edit-expiry"
                v-model="editForm.expiryDate"
                showIcon
                dateFormat="dd.mm.yy"
                placeholder="Ablaufdatum auswählen"
              />
            </div>
          </div>

          <Divider />

          <!-- Lagerort -->
          <div class="form-section flex flex-col gap-3 py-1">
            <p class="m-0 mb-1 text-[0.75rem] font-bold uppercase tracking-[0.07em] text-muted-color">Lagerort</p>
            <div class="form-field">
              <label for="edit-location">Ort</label>
              <Dropdown
                id="edit-location"
                v-model="editForm.location"
                :options="locations"
                placeholder="Ort wählen"
              />
            </div>
          </div>

          <Divider />

          <!-- Barcode -->
          <div class="form-section flex flex-col gap-3 py-1">
            <p class="m-0 mb-1 text-[0.75rem] font-bold uppercase tracking-[0.07em] text-muted-color">Barcode</p>
            <div class="form-field">
              <label for="edit-barcode">Barcode</label>
              <InputText id="edit-barcode" v-model="editForm.barcode" placeholder="Barcode eingeben" />
            </div>
          </div>

        </div>

        <Message severity="info" class="mt-2">
          Beim Speichern wird der Status anhand des Ablaufdatums neu berechnet.
        </Message>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <Button
            label="Abbrechen"
            severity="secondary"
            outlined
            @click="closeEditDialog"
          />
          <Button
            label="Änderungen speichern"
            icon="pi pi-check"
            :disabled="!editForm.name.trim() || !editForm.expiryDate"
            @click="saveEditedItem"
          />
        </div>
      </template>
    </Dialog>
  </main>
</template>

<style scoped>
/* ── Form field layout (used many times in dialogs) ─────── */
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

/* Full-width PrimeVue inputs inside form fields ─────────── */
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

/* Barcode row: input + button side by side ──────────────── */
.barcode-row {
  display: flex;
  gap: 0.5rem;
  align-items: stretch;
}

.barcode-row :deep(.p-inputtext) {
  flex: 1;
  width: auto;
}

@media (max-width: 640px) {
  .barcode-row {
    flex-direction: column;
  }

  .barcode-row :deep(.p-inputtext) {
    width: 100%;
  }
}
</style>
