<script setup lang="ts">
import { computed, ref } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Checkbox from 'primevue/checkbox'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import DatePicker from 'primevue/datepicker'
import Message from 'primevue/message'
import { useGroceryStore } from '@/stores/groceryStore'
import type { GroceryItem } from '@/stores/groceryStore'

const groceryStore = useGroceryStore()

const filter = ref<'open' | 'bought' | 'all'>('open')
const showAddArticleDialog = ref(false)

const selectedBoughtItem = ref<GroceryItem | null>(null)
const showBoughtDialog = ref(false)
const boughtQuantity = ref(1)
const boughtExpiryDate = ref<Date | null>(null)

const visibleItems = computed(() => {
  if (filter.value === 'open') return groceryStore.openShoppingItems
  if (filter.value === 'bought') return groceryStore.boughtShoppingItems
  return groceryStore.shoppingListItems
})

function openBoughtDialog(item: GroceryItem) {
  selectedBoughtItem.value = item
  boughtQuantity.value = 1
  boughtExpiryDate.value = null
  showBoughtDialog.value = true
}

function closeBoughtDialog() {
  showBoughtDialog.value = false
  selectedBoughtItem.value = null
  boughtQuantity.value = 1
  boughtExpiryDate.value = null
}

function confirmOnlyMarkBought() {
  if (!selectedBoughtItem.value) return
  groceryStore.toggleBought(selectedBoughtItem.value.id)
  closeBoughtDialog()
}

function confirmAddToInventory() {
  if (!selectedBoughtItem.value || !boughtExpiryDate.value) return
  groceryStore.markShoppingItemAsPurchased(
    selectedBoughtItem.value.id,
    boughtQuantity.value,
    boughtExpiryDate.value
  )
  closeBoughtDialog()
}
</script>

<template>
  <main class="max-w-[960px] mx-auto">
    <div class="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
      <div>
        <h1 class="m-0 mb-1 text-[1.75rem] font-bold">Einkaufsliste</h1>
        <p class="m-0 text-muted-color">Produkte, die für den nächsten Einkauf vorgesehen sind.</p>
      </div>
      <div class="shrink-0 flex gap-2 flex-wrap items-center">
        <Button
          label="Artikel hinzufügen"
          icon="pi pi-plus"
          @click="showAddArticleDialog = true"
        />
        <Button
          label="Erledigte entfernen"
          icon="pi pi-trash"
          severity="danger"
          outlined
          :disabled="groceryStore.boughtShoppingItems.length === 0"
          @click="groceryStore.clearBoughtItems()"
        />
        <RouterLink
          to="/ionic-shopping-list"
          class="text-sm font-medium text-[var(--sg-primary)] underline underline-offset-4"
        >
          Ionic-Version
        </RouterLink>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <Card>
        <template #content>
          <div class="text-[2rem] font-bold leading-none mb-1">{{ groceryStore.openShoppingItems.length }}</div>
          <div class="text-sm text-muted-color">Offen</div>
        </template>
      </Card>
      <Card>
        <template #content>
          <div class="text-[2rem] font-bold leading-none mb-1">{{ groceryStore.boughtShoppingItems.length }}</div>
          <div class="text-sm text-muted-color">Erledigt</div>
        </template>
      </Card>
      <Card>
        <template #content>
          <div class="text-[2rem] font-bold leading-none mb-1">{{ groceryStore.shoppingListItems.length }}</div>
          <div class="text-sm text-muted-color">Gesamt</div>
        </template>
      </Card>
    </div>

    <div class="flex gap-2 mb-5 flex-wrap">
      <Button
        label="Offen"
        :severity="filter === 'open' ? 'primary' : 'secondary'"
        :outlined="filter !== 'open'"
        @click="filter = 'open'"
      />
      <Button
        label="Erledigt"
        :severity="filter === 'bought' ? 'primary' : 'secondary'"
        :outlined="filter !== 'bought'"
        @click="filter = 'bought'"
      />
      <Button
        label="Alle"
        :severity="filter === 'all' ? 'primary' : 'secondary'"
        :outlined="filter !== 'all'"
        @click="filter = 'all'"
      />
    </div>

    <div v-if="visibleItems.length > 0" class="flex flex-col gap-3">
      <Card v-for="item in visibleItems" :key="item.id" class="w-full">
        <template #content>
          <div class="flex items-center gap-4">
            <Checkbox
              :binary="true"
              :modelValue="item.bought"
              @update:modelValue="openBoughtDialog(item)"
            />
            <div class="flex-1 min-w-0">
              <div class="font-semibold text-base truncate">{{ item.name }}</div>
              <div class="flex flex-wrap gap-2 text-[0.8rem] text-muted-color mt-1">
                <span class="item-category">{{ item.category }}</span>
                <span class="item-quantity">{{ item.quantity }} {{ item.unit }}</span>
                <span v-if="item.expiryDate" class="item-expiry">MHD: {{ item.expiryDate }}</span>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <Tag
                :value="item.bought ? 'Erledigt' : 'Offen'"
                :severity="item.bought ? 'success' : 'warn'"
              />
              <Button
                icon="pi pi-times"
                severity="secondary"
                outlined
                @click="groceryStore.toggleInShoppingList(item.id)"
                aria-label="Aus Einkaufsliste entfernen"
              />
            </div>
          </div>
        </template>
      </Card>
    </div>

    <div v-else class="text-center py-12 px-4 text-muted-color">
      <i class="pi pi-shopping-cart text-[3rem] mb-4 block" />
      <p>Keine Produkte in dieser Ansicht vorhanden.</p>
    </div>

    <Dialog
      v-model:visible="showAddArticleDialog"
      modal
      header="Artikel zur Einkaufsliste hinzufügen"
      :style="{ width: '36rem' }"
      :breakpoints="{ '640px': '95vw' }"
    >
      <div
        v-if="groceryStore.availableForShoppingList.length === 0"
        class="text-center py-12 px-4 text-muted-color"
      >
        <i class="pi pi-check-circle text-[3rem] mb-4 block" />
        <p>Alle verfügbaren Produkte befinden sich bereits in der Einkaufsliste.</p>
      </div>

      <div v-else class="flex flex-col gap-3">
        <div
          v-for="item in groceryStore.availableForShoppingList"
          :key="item.id"
          class="flex items-center justify-between gap-4 py-2 border-b border-surface last:border-b-0"
        >
          <div class="flex flex-col gap-[0.2rem] min-w-0">
            <span class="font-semibold text-[0.95rem]">{{ item.name }}</span>
            <span class="text-[0.8rem] text-muted-color">{{ item.category }} &middot; {{ item.quantity }} {{ item.unit }}</span>
          </div>
          <Button
            label="Hinzufügen"
            icon="pi pi-plus"
            severity="success"
            outlined
            @click="groceryStore.addToShoppingList(item.id)"
          />
        </div>
      </div>
    </Dialog>

    <!-- Dialog: Produkt gekauft -->
    <Dialog
      v-model:visible="showBoughtDialog"
      modal
      header="Produkt gekauft"
      :style="{ width: '38rem' }"
      :breakpoints="{ '640px': '95vw' }"
      @hide="closeBoughtDialog"
    >
      <div class="flex flex-col gap-4">
        <p class="m-0 text-muted-color">
          Möchtest du den Artikel in deinen Vorrat übernehmen oder nur als erledigt markieren?
        </p>

        <div v-if="selectedBoughtItem" class="p-3 bg-surface-50 rounded-md border border-surface">
          <div class="font-bold text-[1.05rem] mb-1">{{ selectedBoughtItem.name }}</div>
          <div class="text-[0.85rem] text-muted-color flex gap-[0.35rem] items-center">
            <span v-if="selectedBoughtItem.category">{{ selectedBoughtItem.category }}</span>
            <span v-if="selectedBoughtItem.status">
              &middot;
              <span
                :class="{
                  'status-fresh': selectedBoughtItem.status === 'fresh',
                  'status-soon': selectedBoughtItem.status === 'soon',
                  'status-critical': selectedBoughtItem.status === 'critical'
                }"
              >
                {{
                  selectedBoughtItem.status === 'fresh'
                    ? 'Frisch'
                    : selectedBoughtItem.status === 'soon'
                      ? 'Läuft bald ab'
                      : 'Abgelaufen'
                }}
              </span>
            </span>
          </div>
        </div>

        <div class="flex flex-col gap-3">
          <div class="flex flex-col gap-[0.35rem]">
            <label class="text-sm font-semibold">Menge</label>
            <InputNumber
              v-model="boughtQuantity"
              :min="1"
              showButtons
              class="w-full"
            />
          </div>
          <div class="flex flex-col gap-[0.35rem]">
            <label class="text-sm font-semibold">Neues Ablaufdatum</label>
            <DatePicker
              v-model="boughtExpiryDate"
              dateFormat="dd.mm.yy"
              showIcon
              class="w-full"
            />
          </div>
        </div>

        <Message severity="info" :closable="false" class="m-0">
          Wenn du den Artikel in den Vorrat übernimmst, werden Menge, Ablaufdatum und Status im
          Inventar aktualisiert.
        </Message>
      </div>

      <template #footer>
        <Button
          label="Abbrechen"
          text
          @click="closeBoughtDialog"
        />
        <Button
          label="Nur als erledigt markieren"
          severity="secondary"
          outlined
          icon="pi pi-check"
          @click="confirmOnlyMarkBought"
        />
        <Button
          label="In Vorrat übernehmen"
          icon="pi pi-box"
          :disabled="!boughtExpiryDate"
          @click="confirmAddToInventory"
        />
      </template>
    </Dialog>
  </main>
</template>

<style scoped>
/* ── Status colors for bought-dialog ────────────────────── */
.status-fresh    { color: #22c55e; font-weight: 600; }
.status-soon     { color: #f59e0b; font-weight: 600; }
.status-critical { color: #ef4444; font-weight: 600; }

/* ── Mobile: full-width action buttons ───────────────────── */
@media (max-width: 650px) {
  .shopping-actions .p-button {
    width: 100%;
    justify-content: center;
  }

  .item-actions {
    flex-wrap: wrap;
    width: 100%;
    justify-content: flex-end;
  }
}

@media (max-width: 640px) {
  .dialog-item-btn .p-button {
    width: 100%;
    justify-content: center;
  }
}
</style>
