<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  IonButton,
  IonChip,
  IonDatetime,
  IonFab,
  IonFabButton,
  IonIcon,
  IonInput,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonModal,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonText,
  IonToggle
} from '@ionic/vue'
import {
  addOutline,
  calendarOutline,
  cartOutline,
  closeOutline,
  star,
  starOutline,
  saveOutline,
  trashOutline
} from 'ionicons/icons'

import { useGroceryStore, type GroceryItem } from '@/stores/groceryStore'
import { getExpiryInfo, getProductExpiryDate } from '@/utils/expiryUtils'
import type { ExpiryInfo } from '@/utils/expiryUtils'

type FilterKey = 'all' | 'fresh' | 'soon' | 'expired' | 'favorites'

interface ProductFormState {
  name: string
  category: string
  quantity: number
  unit: string
  expiryDate: string
  location: string
  favorite: boolean
}

const groceryStore = useGroceryStore()

const categories = ['Obst', 'Gemüse', 'Milchprodukte', 'Getränke', 'Backwaren', 'Sonstiges']
const locations = ['Kühlschrank', 'Küche', 'Vorratsschrank', 'Gefrierfach']

const searchTerm = ref('')
const segmentFilter = ref<FilterKey>('all')
const isModalOpen = ref(false)
const isEditing = ref(false)
const editingItemId = ref<number | null>(null)
const isDatePickerOpen = ref(false)
const productForm = ref<ProductFormState>(createBlankForm())
const productModalBreakpoints = [0, 0.52, 0.86]
const dateModalBreakpoints = [0, 0.36, 0.68]

function createBlankForm(): ProductFormState {
  return {
    name: '',
    category: 'Sonstiges',
    quantity: 1,
    unit: 'Stück',
    expiryDate: '',
    location: 'Küche',
    favorite: false
  }
}

function normalizeExpiryDate(value: string): string {
  return value.trim().split('T')[0] ?? ''
}

function getExpiryShortLabel(item: GroceryItem): string {
  const status = getItemExpiryInfo(item).status

  switch (status) {
    case 'fresh':
      return 'Frisch'
    case 'today':
      return 'Heute'
    case 'soon':
      return 'Bald'
    case 'expired':
      return 'Abgelaufen'
    default:
      return 'Frisch'
  }
}

function getItemExpiryInfo(item: GroceryItem): ExpiryInfo {
  return getExpiryInfo(getProductExpiryDate(item as unknown as Record<string, unknown>))
}

function getIonicSeverity(info: ExpiryInfo): 'success' | 'warning' | 'danger' | 'medium' {
  if (info.severity === 'warn') return 'warning'
  if (info.severity === 'secondary') return 'medium'
  return info.severity
}

const filteredItems = computed(() => {
  const search = searchTerm.value.trim().toLowerCase()

  return groceryStore.items.filter((item) => {
    const expiry = getItemExpiryInfo(item)
    const matchesSearch =
      search.length === 0 ||
      item.name.toLowerCase().includes(search) ||
      item.category.toLowerCase().includes(search)

    if (!matchesSearch) return false

    switch (segmentFilter.value) {
      case 'fresh':
        return expiry.status === 'fresh'
      case 'soon':
        return expiry.status === 'today' || expiry.status === 'soon'
      case 'expired':
        return expiry.status === 'expired'
      case 'favorites':
        return item.favorite
      default:
        return true
    }
  })
})

function openCreateModal(): void {
  productForm.value = createBlankForm()
  editingItemId.value = null
  isEditing.value = false
  isModalOpen.value = true
  isDatePickerOpen.value = false
}

function openEditModal(item: GroceryItem): void {
  productForm.value = {
    name: item.name,
    category: item.category,
    quantity: Number(item.quantity) || 1,
    unit: item.unit,
    expiryDate: item.expiryDate ?? '',
    location: item.location,
    favorite: item.favorite
  }
  editingItemId.value = item.id
  isEditing.value = true
  isModalOpen.value = true
  isDatePickerOpen.value = false
}

function closeModal(): void {
  isModalOpen.value = false
  isDatePickerOpen.value = false
}

function adjustQuantity(delta: number): void {
  productForm.value.quantity = Math.max(0, (Number(productForm.value.quantity) || 0) + delta)
}

function openDatePicker(): void {
  isDatePickerOpen.value = true
}

function closeDatePicker(): void {
  isDatePickerOpen.value = false
}

function confirmDatePicker(): void {
  isDatePickerOpen.value = false
}

function getExpiryDisplayValue(): string {
  return productForm.value.expiryDate || 'Datum wählen'
}

function toggleShoppingList(item: GroceryItem): void {
  groceryStore.toggleInShoppingList(item.id)
}

function toggleFavorite(item: GroceryItem): void {
  groceryStore.toggleFavorite(item.id)
}

function saveProduct(): void {
  if (!productForm.value.name.trim()) return

  const payload = {
    name: productForm.value.name,
    category: productForm.value.category,
    quantity: Math.max(0, Number(productForm.value.quantity) || 0),
    unit: productForm.value.unit,
    expiryDate: normalizeExpiryDate(productForm.value.expiryDate),
    location: productForm.value.location,
    favorite: productForm.value.favorite
  }

  if (isEditing.value && editingItemId.value !== null) {
    const currentItem = groceryStore.items.find((item) => item.id === editingItemId.value)

    if (currentItem) {
      groceryStore.updateItem({
        ...currentItem,
        ...payload,
        id: currentItem.id
      })

      if (currentItem.favorite !== payload.favorite) {
        groceryStore.toggleFavorite(currentItem.id)
      }
    }
  } else {
    groceryStore.addItem({
      ...payload,
      status: 'fresh',
      inShoppingList: false,
      bought: false
    })
  }

  closeModal()
}
</script>

<template>
  <main class="w-full">
    <section class="mb-4 flex flex-col gap-3">
      <div class="flex flex-col gap-1">
        <h1 class="m-0 text-3xl font-bold text-color">Inventar</h1>
        <p class="m-0 text-sm text-muted-color">
        </p>
      </div>

      <IonSearchbar
        v-model="searchTerm"
        placeholder="Produkte suchen"
        show-clear-button="focus"
        inputmode="search"
      />

      <IonSegment v-model="segmentFilter" scrollable class="overflow-x-auto freshflow-segment">
        <IonSegmentButton value="all">
          <IonLabel>Alle</IonLabel>
        </IonSegmentButton>
        <IonSegmentButton value="fresh">
          <IonLabel>Frisch</IonLabel>
        </IonSegmentButton>
        <IonSegmentButton value="soon">
          <IonLabel>Bald</IonLabel>
        </IonSegmentButton>
        <IonSegmentButton value="expired">
          <IonLabel>Alt</IonLabel>
        </IonSegmentButton>
        <IonSegmentButton value="favorites">
          <IonLabel>Favorit</IonLabel>
        </IonSegmentButton>
      </IonSegment>
    </section>

    <section class="mb-24">
      <IonList v-if="filteredItems.length > 0" lines="none" class="bg-transparent p-0">
        <IonItemSliding
          v-for="item in filteredItems"
          :key="item.id"
          class="mb-3 overflow-hidden rounded-2xl border border-[var(--sg-border)] bg-[var(--sg-surface)] shadow-sm"
        >
          <IonItem
            button
            :detail="false"
            lines="none"
            class="min-h-[72px]"
            @click="openEditModal(item)"
          >
            <div class="flex w-full items-start gap-3 py-1">
              <button
                type="button"
                class="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--sg-border)] bg-[var(--sg-surface)] text-[var(--sg-primary)] transition-colors active:bg-[var(--sg-primary-soft)]"
                :aria-label="item.favorite ? 'Favorit entfernen' : 'Als Favorit markieren'"
                @click.stop="toggleFavorite(item)"
              >
                <IonIcon :icon="item.favorite ? star : starOutline" class="text-[1.05rem]" />
              </button>

              <IonLabel class="ion-text-wrap min-w-0 flex-1 mr-2">
                <h2 class="m-0 text-[1.05rem] font-semibold leading-tight text-color">
                  {{ item.name }}
                </h2>
                <p class="m-0 mt-1 text-sm leading-snug text-muted-color">
                  {{ item.category }} · {{ item.quantity }} {{ item.unit }}
                </p>
                <p class="m-0 mt-1 text-sm leading-snug text-muted-color">
                  {{ item.expiryDate || 'Kein Datum' }} · {{ item.location }}
                </p>
              </IonLabel>

              <div class="flex shrink-0 flex-col items-end gap-2 pt-0.5">
                <div class="inline-flex items-center gap-1.5 rounded-full bg-[var(--p-surface-100, #f3f4f6)] px-2.5 py-1 text-[0.72rem] font-medium text-color status-pill">
                  <span class="h-2 w-2 rounded-full" :class="{
                    'status-pill--fresh': getItemExpiryInfo(item).status === 'fresh',
                    'status-pill--soon': getItemExpiryInfo(item).status === 'soon' || getItemExpiryInfo(item).status === 'today',
                    'status-pill--expired': getItemExpiryInfo(item).status === 'expired'
                  }" />
                  <span>{{ getExpiryShortLabel(item) }}</span>
                </div>

                <div v-if="item.inShoppingList" class="inline-flex items-center gap-1 text-[0.7rem] font-medium text-muted-color">
                  <IonIcon :icon="cartOutline" class="text-[0.85rem]" />
                  <span>In Liste</span>
                </div>
              </div>
            </div>
          </IonItem>

          <IonItemOptions side="start">
            <IonItemOption color="success" @click="toggleShoppingList(item)">
              <IonIcon :icon="cartOutline" slot="start" />
              {{ item.inShoppingList ? 'In Liste' : 'Zur Einkaufsliste' }}
            </IonItemOption>
          </IonItemOptions>

          <IonItemOptions side="end">
            <IonItemOption color="danger" @click="groceryStore.deleteItem(item.id)">
              <IonIcon :icon="trashOutline" slot="start" />
              Löschen
            </IonItemOption>
          </IonItemOptions>
        </IonItemSliding>
      </IonList>

      <div
        v-else
        class="rounded-2xl border border-dashed border-[var(--sg-border)] bg-[var(--sg-surface)] px-5 py-8 text-center empty-state-card"
      >
        <p class="m-0 text-base font-semibold text-color">Keine Produkte gefunden</p>
        <p class="m-0 mt-2 text-sm text-muted-color">
          Für diesen Filter gibt es aktuell keine Produkte.
        </p>
        <IonButton class="mt-4 freshflow-cta" color="success" @click="openCreateModal">
          Produkt hinzufügen
        </IonButton>
      </div>
    </section>

    <IonFab
      class="fixed right-4 z-20"
      style="bottom: calc(6.5rem + env(safe-area-inset-bottom));"
    >
      <IonFabButton aria-label="Neues Produkt" color="success" @click="openCreateModal">
        <IonIcon :icon="addOutline" color="light" />
      </IonFabButton>
    </IonFab>

    <IonModal
      :is-open="isModalOpen"
      :breakpoints="productModalBreakpoints"
      :initial-breakpoint="0.52"
      :handle="true"
      :backdrop-dismiss="true"
      @didDismiss="closeModal"
    >
      <div class="flex max-h-[86vh] flex-col gap-3 overflow-y-auto p-3 pt-2">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h2 class="m-0 text-lg font-bold text-color">
              {{ isEditing ? 'Produkt bearbeiten' : 'Neues Produkt' }}
            </h2>
            <p class="m-0 mt-1 text-sm text-muted-color">
              {{
                isEditing
                  ? 'Änderungen direkt im mobilen Vergleich prüfen.'
                  : 'Ein neues Produkt zur Inventarliste hinzufügen.'
              }}
            </p>
          </div>

          <IonButton fill="clear" color="medium" size="small" aria-label="Schließen" @click="closeModal">
            <IonIcon :icon="closeOutline" slot="icon-only" />
          </IonButton>
        </div>

        <div class="grid gap-2.5">
          <div class="grid gap-2 rounded-2xl border border-[var(--sg-border)] bg-[var(--sg-surface)] p-3">
            <p class="m-0 text-sm font-semibold uppercase tracking-[0.07em] text-muted-color">
              Produktdaten
            </p>
            <IonInput
              v-model="productForm.name"
              fill="outline"
              label="Name"
              label-placement="stacked"
              placeholder="z. B. Milch"
            />

            <label class="flex flex-col gap-1.5">
              <span class="text-sm font-medium text-color">Kategorie</span>
              <select v-model="productForm.category" class="freshflow-native-select">
                <option v-for="category in categories" :key="category" :value="category">
                  {{ category }}
                </option>
              </select>
            </label>
          </div>

          <div class="grid gap-2 rounded-2xl border border-[var(--sg-border)] bg-[var(--sg-surface)] p-3">
            <p class="m-0 text-sm font-semibold uppercase tracking-[0.07em] text-muted-color">
              Menge &amp; Ablaufdatum
            </p>

            <div class="grid grid-cols-[auto_1fr_auto] items-end gap-2">
              <IonButton fill="outline" color="medium" class="h-10 shrink-0" @click="adjustQuantity(-1)">
                -
              </IonButton>
              <IonInput
                v-model="productForm.quantity"
                fill="outline"
                type="number"
                label="Menge"
                label-placement="stacked"
                min="0"
                class="min-w-0"
              />
              <IonButton fill="outline" color="medium" class="h-10 shrink-0" @click="adjustQuantity(1)">
                +
              </IonButton>
            </div>

            <IonInput
              v-model="productForm.unit"
              fill="outline"
              label="Einheit"
              label-placement="stacked"
              placeholder="z. B. Stück"
            />
          </div>

          <div class="grid gap-2 rounded-2xl border border-[var(--sg-border)] bg-[var(--sg-surface)] p-3">
            <p class="m-0 text-sm font-semibold uppercase tracking-[0.07em] text-muted-color">
              Details
            </p>

            <IonButton
              fill="outline"
              color="medium"
              class="w-full justify-between compact-date-trigger"
              @click="openDatePicker"
            >
              <span class="flex items-center gap-2">
                <IonIcon :icon="calendarOutline" />
                <span>Ablaufdatum</span>
              </span>
              <span class="date-trigger-value">{{ getExpiryDisplayValue() }}</span>
            </IonButton>

            <label class="flex flex-col gap-1.5">
              <span class="text-sm font-medium text-color">Lagerort</span>
              <select v-model="productForm.location" class="freshflow-native-select">
                <option v-for="location in locations" :key="location" :value="location">
                  {{ location }}
                </option>
              </select>
            </label>

            <div class="flex items-center justify-between gap-3 rounded-xl border border-[var(--sg-border)] px-3 py-2">
              <div>
                <p class="m-0 text-sm font-medium text-color">Favorit</p>
                <p class="m-0 mt-1 text-xs text-muted-color">Mit Stern markieren.</p>
              </div>
              <IonToggle v-model="productForm.favorite" />
            </div>
          </div>
        </div>

        <div class="sticky bottom-0 flex gap-3 border-t border-[var(--sg-border)] bg-[var(--sg-surface)] pt-3">
          <IonButton expand="block" fill="outline" color="medium" class="flex-1" @click="closeModal">
            Abbrechen
          </IonButton>
          <IonButton
            expand="block"
            color="success"
            class="flex-1 freshflow-save"
            :disabled="!productForm.name.trim()"
            @click="saveProduct"
          >
            <IonIcon :icon="saveOutline" slot="start" />
            Speichern
          </IonButton>
        </div>
      </div>
    </IonModal>

    <IonModal
      :is-open="isDatePickerOpen"
      :breakpoints="dateModalBreakpoints"
      :initial-breakpoint="0.36"
      :handle="true"
      :backdrop-dismiss="true"
      @didDismiss="closeDatePicker"
    >
      <div class="flex flex-col gap-3 p-3 pt-2">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="m-0 text-lg font-bold text-color">Ablaufdatum</h3>
            <p class="m-0 mt-1 text-sm text-muted-color">Wähle ein Datum für das Produkt.</p>
          </div>

          <IonButton fill="clear" color="medium" size="small" aria-label="Schließen" @click="closeDatePicker">
            <IonIcon :icon="closeOutline" slot="icon-only" />
          </IonButton>
        </div>

        <IonDatetime v-model="productForm.expiryDate" presentation="date" />

        <div class="flex gap-3">
          <IonButton expand="block" fill="outline" color="medium" class="flex-1" @click="closeDatePicker">
            Abbrechen
          </IonButton>
          <IonButton expand="block" color="success" class="flex-1" @click="confirmDatePicker">
            Übernehmen
          </IonButton>
        </div>
      </div>
    </IonModal>
  </main>
</template>

<style scoped>
:host {
  --freshflow-green: var(--sg-primary, #16a34a);
  --freshflow-green-strong: #15803d;
  --freshflow-green-soft: rgba(22, 163, 74, 0.12);
}

:deep(.freshflow-segment) {
  --indicator-color: var(--freshflow-green);
  --color-checked: var(--freshflow-green);
}

:deep(.freshflow-segment ion-segment-button.segment-button-checked) {
  color: var(--freshflow-green);
}

:deep(.freshflow-segment ion-segment-button) {
  --color: var(--sg-muted, #64748b);
}

:deep(.freshflow-cta) {
  --background: var(--freshflow-green);
  --background-hover: var(--freshflow-green-strong);
  --background-activated: var(--freshflow-green-strong);
  --color: #ffffff;
}

:deep(.freshflow-save) {
  --background: var(--freshflow-green);
  --background-hover: var(--freshflow-green-strong);
  --background-activated: var(--freshflow-green-strong);
  --color: #ffffff;
}

:deep(ion-fab-button[color='success']) {
  --background: var(--freshflow-green);
  --background-hover: var(--freshflow-green-strong);
  --background-activated: var(--freshflow-green-strong);
  --color: #ffffff;
}

:deep(.empty-state-card) {
  --background: var(--p-surface-0, #ffffff);
}

:deep(.compact-date-trigger) {
  --padding-start: 0.85rem;
  --padding-end: 0.85rem;
  --padding-top: 0.8rem;
  --padding-bottom: 0.8rem;
  justify-content: space-between;
  gap: 0.75rem;
  text-transform: none;
  font-weight: 500;
}

:deep(.date-trigger-value) {
  color: var(--sg-muted, #64748b);
  font-size: 0.85rem;
}

:deep(.status-pill--fresh) {
  background: #22c55e;
}

:deep(.status-pill--soon) {
  background: #f59e0b;
}

:deep(.status-pill--expired) {
  background: #ef4444;
}

:deep(.freshflow-segment ion-segment-button::part(native)) {
  min-height: 34px;
}

:deep(.freshflow-segment ion-segment-button.segment-button-checked::part(native)) {
  background: rgba(22, 163, 74, 0.08);
}

.freshflow-native-select {
  width: 100%;
  min-height: 44px;
  border-radius: 0.875rem;
  border: 1px solid var(--sg-border, #d1d5db);
  background: var(--p-surface-0, #ffffff);
  color: var(--sg-text, #111827);
  padding: 0.75rem 0.9rem;
  font: inherit;
  line-height: 1.2;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-image: linear-gradient(45deg, transparent 50%, var(--sg-muted, #64748b) 50%),
    linear-gradient(135deg, var(--sg-muted, #64748b) 50%, transparent 50%);
  background-position: calc(100% - 1.15rem) 50%, calc(100% - 0.8rem) 50%;
  background-size: 0.35rem 0.35rem, 0.35rem 0.35rem;
  background-repeat: no-repeat;
}

.freshflow-native-select:focus {
  outline: none;
  border-color: var(--freshflow-green);
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.14);
}

.freshflow-native-select option {
  color: var(--sg-text, #111827);
}

:deep(.freshflow-segment ion-segment-button.segment-button-checked) {
  --indicator-color: var(--freshflow-green);
}
</style>