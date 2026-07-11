<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  IonButton,
  IonCheckbox,
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
  IonSegment,
  IonSegmentButton,
  IonText
} from '@ionic/vue'
import {
  addOutline,
  bagCheckOutline,
  checkmarkOutline,
  closeOutline,
  cartOutline,
  trashOutline
} from 'ionicons/icons'

import { useGroceryStore, type GroceryItem } from '@/stores/groceryStore'

type ShoppingFilter = 'open' | 'bought' | 'all'

const groceryStore = useGroceryStore()

const filter = ref<ShoppingFilter>('open')
const showAddModal = ref(false)
const showBoughtModal = ref(false)
const selectedBoughtItem = ref<GroceryItem | null>(null)
const boughtQuantity = ref(1)
const boughtExpiryDate = ref('')

function parseBoughtExpiryDate(value: string): Date | undefined {
  const trimmedValue = value.trim()
  if (!trimmedValue) return undefined

  const normalizedValue = trimmedValue.length === 10 ? `${trimmedValue}T12:00:00` : trimmedValue
  const parsedDate = new Date(normalizedValue)

  return Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate
}

const visibleItems = computed(() => {
  if (filter.value === 'open') return groceryStore.openShoppingItems
  if (filter.value === 'bought') return groceryStore.boughtShoppingItems
  return groceryStore.shoppingListItems
})

function openBoughtDialog(item: GroceryItem): void {
  selectedBoughtItem.value = item
  boughtQuantity.value = 1
  boughtExpiryDate.value = ''
  showBoughtModal.value = true
}

function closeBoughtDialog(): void {
  showBoughtModal.value = false
  selectedBoughtItem.value = null
  boughtQuantity.value = 1
  boughtExpiryDate.value = ''
}

function markOnlyAsBought(): void {
  if (!selectedBoughtItem.value) return

  groceryStore.toggleBought(selectedBoughtItem.value.id)
  closeBoughtDialog()
}

function addToInventory(): void {
  if (!selectedBoughtItem.value) return

  const expiryDate = parseBoughtExpiryDate(boughtExpiryDate.value)

  groceryStore.markShoppingItemAsPurchased(
    selectedBoughtItem.value.id,
    boughtQuantity.value,
    expiryDate
  )
  closeBoughtDialog()
}

function addAvailableItem(itemId: number): void {
  groceryStore.addToShoppingList(itemId)
}

function removeFromList(itemId: number): void {
  groceryStore.removeFromShoppingList(itemId)
}
</script>

<template>
  <main class="w-full px-4 pb-[calc(10rem+env(safe-area-inset-bottom))] pt-4">
    <section class="mb-3 space-y-3">
      <div class="flex items-start gap-3">
        <div class="min-w-0">
          <h1 class="m-0 text-3xl font-bold tracking-tight text-color">Ionic-Einkaufsliste</h1>
          <p class="m-0 mt-1 text-sm text-muted-color">
            Mobile Vergleichsansicht für die bestehende Einkaufsliste.
          </p>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-2">
        <div class="rounded-2xl border border-[var(--sg-border)] bg-[var(--sg-surface)] px-3 py-2 shadow-sm">
          <div class="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-color">Offen</div>
          <div class="mt-1 text-lg font-bold text-color">{{ groceryStore.openShoppingItems.length }}</div>
        </div>
        <div class="rounded-2xl border border-[var(--sg-border)] bg-[var(--sg-surface)] px-3 py-2 shadow-sm">
          <div class="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-color">Erledigt</div>
          <div class="mt-1 text-lg font-bold text-color">{{ groceryStore.boughtShoppingItems.length }}</div>
        </div>
        <div class="rounded-2xl border border-[var(--sg-border)] bg-[var(--sg-surface)] px-3 py-2 shadow-sm">
          <div class="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-color">Gesamt</div>
          <div class="mt-1 text-lg font-bold text-color">{{ groceryStore.shoppingListItems.length }}</div>
        </div>
      </div>

      <div class="space-y-2">
        <IonSegment v-model="filter" class="freshflow-segment">
          <IonSegmentButton value="open">
            <IonLabel>Offen</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="bought">
            <IonLabel>Erledigt</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="all">
            <IonLabel>Alle</IonLabel>
          </IonSegmentButton>
        </IonSegment>

        <div class="flex justify-end">
          <IonButton
            v-if="groceryStore.boughtShoppingItems.length > 0"
            fill="clear"
            color="medium"
            size="small"
            class="h-auto px-0 text-[0.8rem] font-medium text-[var(--sg-muted)]"
            @click="groceryStore.clearBoughtItems()"
          >
            <IonIcon :icon="trashOutline" slot="start" />
            Erledigte löschen
          </IonButton>
        </div>
      </div>
    </section>

    <section>
      <IonList v-if="visibleItems.length > 0" lines="none" class="bg-transparent p-0">
        <IonItemSliding
          v-for="item in visibleItems"
          :key="item.id"
          class="mb-2.5 overflow-hidden rounded-2xl border border-[var(--sg-border)] bg-[var(--sg-surface)] shadow-sm"
        >
          <IonItem lines="none" class="shopping-item-shell">
            <div class="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-2 py-1.5">
              <IonCheckbox
                :checked="item.bought"
                class="mt-0.5 shrink-0"
                aria-label="Produkt als erledigt markieren"
                @click.stop.prevent="openBoughtDialog(item)"
              />

              <div class="min-w-0">
                <h2 class="m-0 text-left text-[1rem] font-semibold leading-tight text-color">
                  {{ item.name }}
                </h2>
                <p class="m-0 mt-1 text-left text-[0.8rem] leading-snug text-muted-color">
                  {{ item.category }} · {{ item.quantity }} {{ item.unit }}
                </p>
                <p class="m-0 mt-1 text-left text-[0.8rem] leading-snug text-muted-color">
                  MHD: {{ item.expiryDate || 'Kein Datum' }}
                </p>
              </div>

              <div class="pt-0.5">
                <IonChip
                  :color="item.bought ? 'success' : 'warning'"
                  class="m-0 shrink-0"
                >
                  {{ item.bought ? 'Erledigt' : 'Offen' }}
                </IonChip>
              </div>
                </div>
          </IonItem>

          <IonItemOptions side="end">
            <IonItemOption color="danger" @click="removeFromList(item.id)">
              <IonIcon :icon="closeOutline" slot="start" />
              Löschen
            </IonItemOption>
          </IonItemOptions>
        </IonItemSliding>
      </IonList>

      <div
        v-else
        class="rounded-2xl border border-dashed border-[var(--sg-border)] bg-[var(--sg-surface)] px-5 py-10 text-center text-muted-color"
      >
        <IonIcon :icon="cartOutline" class="mb-3 text-[2.5rem] text-[var(--sg-primary)]" />
        <p class="m-0">Keine Produkte in dieser Ansicht vorhanden.</p>
      </div>
    </section>

    <IonFab vertical="bottom" horizontal="end" class="fixed bottom-[92px] right-4 z-30">
      <IonFabButton color="success" @click="showAddModal = true">
        <IonIcon :icon="addOutline" />
      </IonFabButton>
    </IonFab>

    <IonModal :is-open="showAddModal" @didDismiss="showAddModal = false">
      <div class="mx-auto w-full max-w-[34rem] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div class="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 class="m-0 text-xl font-bold text-color">Artikel hinzufügen</h2>
            <p class="m-0 mt-1 text-sm text-muted-color">
              Produkte aus dem Bestand zur Einkaufsliste verschieben.
            </p>
          </div>
          <IonButton fill="clear" color="medium" @click="showAddModal = false">
            <IonIcon :icon="closeOutline" slot="icon-only" />
          </IonButton>
        </div>

        <div
          v-if="groceryStore.availableForShoppingList.length === 0"
          class="rounded-2xl border border-dashed border-[var(--sg-border)] bg-[var(--sg-surface)] px-5 py-10 text-center text-muted-color"
        >
          <IonIcon :icon="checkmarkOutline" class="mb-3 text-[2.5rem] text-[var(--sg-primary)]" />
          <p class="m-0">Alle verfügbaren Produkte befinden sich bereits in der Einkaufsliste.</p>
        </div>

        <IonList v-else lines="none" class="bg-transparent p-0">
          <IonItem
            v-for="item in groceryStore.availableForShoppingList"
            :key="item.id"
            lines="none"
            class="mb-2 overflow-hidden rounded-2xl border border-[var(--sg-border)] bg-[var(--sg-surface)] shadow-sm"
          >
            <div class="flex w-full items-center justify-between gap-3 py-1">
              <div class="min-w-0">
                <div class="truncate font-semibold text-color">{{ item.name }}</div>
                <div class="mt-1 text-sm text-muted-color">
                  {{ item.category }} · {{ item.quantity }} {{ item.unit }}
                </div>
              </div>
              <IonButton size="small" color="success" @click="addAvailableItem(item.id)">
                <IonIcon :icon="addOutline" slot="start" />
                Hinzufügen
              </IonButton>
            </div>
          </IonItem>
        </IonList>
      </div>
    </IonModal>

    <IonModal :is-open="showBoughtModal" @didDismiss="closeBoughtDialog">
      <div class="mx-auto w-full max-w-[34rem] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div class="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 class="m-0 text-xl font-bold text-color">Produkt gekauft</h2>
            <p class="m-0 mt-1 text-sm text-muted-color">
              Als erledigt markieren oder in den Vorrat übernehmen.
            </p>
          </div>
          <IonButton fill="clear" color="medium" @click="closeBoughtDialog">
            <IonIcon :icon="closeOutline" slot="icon-only" />
          </IonButton>
        </div>

        <div
          v-if="selectedBoughtItem"
          class="rounded-2xl border border-[var(--sg-border)] bg-[var(--sg-surface)] px-4 py-3 shadow-sm"
        >
          <div class="font-semibold text-color">{{ selectedBoughtItem.name }}</div>
          <div class="mt-1 text-sm text-muted-color">
            {{ selectedBoughtItem.category }} · {{ selectedBoughtItem.quantity }} {{ selectedBoughtItem.unit }}
          </div>
        </div>

        <div class="mt-4 rounded-2xl border border-[var(--sg-border)] bg-[var(--sg-surface)] px-4 py-4 shadow-sm">
          <div class="mb-3 text-sm font-semibold text-color">In Vorrat übernehmen</div>

          <div class="space-y-3">
            <label class="block text-sm font-medium text-color">
              Menge
              <IonInput
                v-model="boughtQuantity"
                type="number"
                inputmode="numeric"
                min="1"
                fill="outline"
                class="mt-2"
              />
            </label>

            <label class="block text-sm font-medium text-color">
              Neues Ablaufdatum
              <IonDatetime
                v-model="boughtExpiryDate"
                presentation="date"
                class="mt-2 rounded-2xl border border-[var(--sg-border)] bg-[var(--sg-background)]"
              />
            </label>

            <IonText color="medium">
              <p class="m-0 text-sm leading-snug">
                Wenn du den Artikel übernimmst, werden Menge und Ablaufdatum im Inventar aktualisiert.
              </p>
            </IonText>
          </div>
        </div>

        <div class="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <IonButton fill="outline" color="medium" @click="markOnlyAsBought">
            Nur erledigt
          </IonButton>
          <IonButton color="success" @click="addToInventory">
            <IonIcon :icon="bagCheckOutline" slot="start" />
            In Vorrat übernehmen
          </IonButton>
        </div>
      </div>
    </IonModal>
  </main>
</template>

<style scoped>
.shopping-item-shell {
  --padding-start: 0;
  --inner-padding-end: 0;
  --inner-padding-top: 0;
  --inner-padding-bottom: 0;
  --background: transparent;
  --min-height: auto;
}
</style>