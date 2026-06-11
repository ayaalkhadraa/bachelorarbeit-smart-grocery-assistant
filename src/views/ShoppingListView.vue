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
  <main class="shopping-page">
    <div class="shopping-header">
      <div class="shopping-header-content">
        <h1>Einkaufsliste</h1>
        <p>Produkte, die für den nächsten Einkauf vorgesehen sind.</p>
      </div>
      <div class="shopping-actions">
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
      </div>
    </div>

    <div class="stats-grid">
      <Card>
        <template #content>
          <div class="stat-number">{{ groceryStore.openShoppingItems.length }}</div>
          <div class="stat-label">Offen</div>
        </template>
      </Card>
      <Card>
        <template #content>
          <div class="stat-number">{{ groceryStore.boughtShoppingItems.length }}</div>
          <div class="stat-label">Erledigt</div>
        </template>
      </Card>
      <Card>
        <template #content>
          <div class="stat-number">{{ groceryStore.shoppingListItems.length }}</div>
          <div class="stat-label">Gesamt</div>
        </template>
      </Card>
    </div>

    <div class="filter-bar">
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

    <div v-if="visibleItems.length > 0" class="shopping-list">
      <Card v-for="item in visibleItems" :key="item.id" class="shopping-item">
        <template #content>
          <div class="item-main">
            <Checkbox
              :binary="true"
              :modelValue="item.bought"
              @update:modelValue="openBoughtDialog(item)"
            />
            <div class="item-info">
              <div class="item-name">{{ item.name }}</div>
              <div class="item-meta">
                <span class="item-category">{{ item.category }}</span>
                <span class="item-quantity">{{ item.quantity }} {{ item.unit }}</span>
                <span v-if="item.expiryDate" class="item-expiry">MHD: {{ item.expiryDate }}</span>
              </div>
            </div>
            <div class="item-actions">
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

    <div v-else class="empty-state">
      <i class="pi pi-shopping-cart empty-state-icon" />
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
        class="empty-state"
      >
        <i class="pi pi-check-circle empty-state-icon" />
        <p>Alle verfügbaren Produkte befinden sich bereits in der Einkaufsliste.</p>
      </div>

      <div v-else class="dialog-list">
        <div
          v-for="item in groceryStore.availableForShoppingList"
          :key="item.id"
          class="dialog-item"
        >
          <div class="dialog-item-info">
            <span class="dialog-item-name">{{ item.name }}</span>
            <span class="dialog-item-meta">{{ item.category }} &middot; {{ item.quantity }} {{ item.unit }}</span>
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
      <div class="bought-dialog-content">
        <p class="bought-dialog-subtitle">
          Möchtest du den Artikel in deinen Vorrat übernehmen oder nur als erledigt markieren?
        </p>

        <div v-if="selectedBoughtItem" class="bought-dialog-item-info">
          <div class="bought-dialog-item-name">{{ selectedBoughtItem.name }}</div>
          <div class="bought-dialog-item-meta">
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

        <div class="bought-dialog-form">
          <div class="bought-dialog-field">
            <label class="bought-dialog-label">Menge</label>
            <InputNumber
              v-model="boughtQuantity"
              :min="1"
              showButtons
              class="bought-dialog-input"
            />
          </div>
          <div class="bought-dialog-field">
            <label class="bought-dialog-label">Neues Ablaufdatum</label>
            <DatePicker
              v-model="boughtExpiryDate"
              dateFormat="dd.mm.yy"
              showIcon
              class="bought-dialog-input"
            />
          </div>
        </div>

        <Message severity="info" :closable="false" class="bought-dialog-message">
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
.shopping-page {
  padding: 1.5rem;
  max-width: 960px;
  margin: 0 auto;
}

.shopping-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.shopping-header-content h1 {
  margin: 0 0 0.25rem;
  font-size: 1.75rem;
}

.shopping-header-content p {
  margin: 0;
  color: var(--p-text-muted-color, #6c757d);
}

.shopping-actions {
  flex-shrink: 0;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--p-text-muted-color, #6c757d);
}

.filter-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}

.shopping-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.shopping-item {
  width: 100%;
}

.item-main {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-weight: 600;
  font-size: 1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: var(--p-text-muted-color, #6c757d);
  margin-top: 0.25rem;
}

.item-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--p-text-muted-color, #6c757d);
}

.empty-state-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  display: block;
}

/* Responsive */
@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 650px) {
  .shopping-header {
    flex-direction: column;
  }

  .shopping-actions {
    width: 100%;
    flex-direction: column;
  }

  .shopping-actions .p-button {
    width: 100%;
    justify-content: center;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .item-main {
    flex-wrap: wrap;
  }

  .item-actions {
    flex-wrap: wrap;
    width: 100%;
    justify-content: flex-end;
  }
}

/* Dialog: available items list */
.dialog-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.dialog-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--p-surface-border, #e5e7eb);
}

.dialog-item:last-child {
  border-bottom: none;
}

.dialog-item-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.dialog-item-name {
  font-weight: 600;
  font-size: 0.95rem;
}

/* Dialog: bought item */
.bought-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.bought-dialog-subtitle {
  margin: 0;
  color: var(--p-text-muted-color, #6c757d);
}

.bought-dialog-item-info {
  padding: 0.75rem 1rem;
  background: var(--p-surface-50, #f9fafb);
  border-radius: 6px;
  border: 1px solid var(--p-surface-border, #e5e7eb);
}

.bought-dialog-item-name {
  font-weight: 700;
  font-size: 1.05rem;
  margin-bottom: 0.25rem;
}

.bought-dialog-item-meta {
  font-size: 0.85rem;
  color: var(--p-text-muted-color, #6c757d);
  display: flex;
  gap: 0.35rem;
  align-items: center;
}

.status-fresh { color: #22c55e; font-weight: 600; }
.status-soon  { color: #f59e0b; font-weight: 600; }
.status-critical { color: #ef4444; font-weight: 600; }

.bought-dialog-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.bought-dialog-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.bought-dialog-label {
  font-size: 0.875rem;
  font-weight: 600;
}

.bought-dialog-input {
  width: 100%;
}

.bought-dialog-message {
  margin: 0;
}

.dialog-item-meta {
  font-size: 0.8rem;
  color: var(--p-text-muted-color, #6c757d);
}

@media (max-width: 640px) {
  .dialog-item {
    flex-wrap: wrap;
  }

  .dialog-item .p-button {
    width: 100%;
    justify-content: center;
  }
}
</style>