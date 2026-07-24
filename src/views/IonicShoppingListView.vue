<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCheckbox,
  IonChip,
  IonCol,
  IonContent,
  IonDatetime,
  IonFab,
  IonFabButton,
  IonFooter,
  IonGrid,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonModal,
  IonRow,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonText,
  IonPage,
  IonTitle,
  IonToolbar,
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
import IonicPageHeader from '@/components/ionic/IonicPageHeader.vue'
import { logout } from '@/utils/logout'

type ShoppingFilter = 'open' | 'bought' | 'all'

const groceryStore = useGroceryStore()
const router = useRouter()

const categories = ['Obst', 'Gemüse', 'Milchprodukte', 'Getränke', 'Backwaren', 'Sonstiges']

const filter = ref<ShoppingFilter>('open')
const showAddModal = ref(false)
const showBoughtModal = ref(false)
const selectedBoughtItem = ref<GroceryItem | null>(null)
const boughtQuantity = ref(1)
const boughtExpiryDate = ref('')
const manualName = ref('')
const manualQuantity = ref(1)
const manualCategory = ref('Sonstiges')

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

function resetManualItem(): void {
  manualName.value = ''
  manualQuantity.value = 1
  manualCategory.value = 'Sonstiges'
}

function addManualShoppingItem(): void {
  const created = groceryStore.addManualShoppingListItem({
    name: manualName.value,
    category: manualCategory.value,
    quantity: manualQuantity.value
  })

  if (!created) return

  resetManualItem()
  showAddModal.value = false
}

function handleLogout(): void {
  logout(router)
}
</script>

<template>
  <IonPage>
    <IonicPageHeader title="Einkaufsliste" @logout="handleLogout" />
    <IonContent :fullscreen="true">
      <main class="app-page-shell app-page-stack app-page-shell--narrow">
      <section class="shopping-header">
      <IonCard class="summary-card">
        <IonCardContent>
          <IonGrid class="ion-no-padding">
            <IonRow>
              <IonCol size="4" class="summary-cell">
                <span class="summary-label">Offen</span>
                <strong class="summary-value">
                  {{ groceryStore.openShoppingItems.length }}
                </strong>
              </IonCol>

              <IonCol size="4" class="summary-cell summary-cell--divided">
                <span class="summary-label">Erledigt</span>
                <strong class="summary-value">
                  {{ groceryStore.boughtShoppingItems.length }}
                </strong>
              </IonCol>

              <IonCol size="4" class="summary-cell summary-cell--divided">
                <span class="summary-label">Gesamt</span>
                <strong class="summary-value">
                  {{ groceryStore.shoppingListItems.length }}
                </strong>
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonCardContent>
      </IonCard>

      <div class="filter-area">
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

        <div class="clear-action">
          <IonButton
            v-if="groceryStore.boughtShoppingItems.length > 0"
            fill="clear"
            color="medium"
            size="small"
            @click="groceryStore.clearBoughtItems()"
          >
            <IonIcon :icon="trashOutline" slot="start" />
            Erledigte löschen
          </IonButton>
        </div>
      </div>
    </section>

    <section class="shopping-list-section">
      <IonList
        v-if="visibleItems.length > 0"
        lines="none"
        class="shopping-list"
      >
        <IonItemSliding
          v-for="item in visibleItems"
          :key="item.id"
          class="shopping-sliding-item"
        >
          <IonItem lines="none" class="shopping-item-shell">
            <div class="shopping-item-layout">
              <IonCheckbox
                :checked="item.bought"
                class="shopping-checkbox"
                aria-label="Produkt als erledigt markieren"
                @click.stop.prevent="openBoughtDialog(item)"
              />

              <div class="shopping-item-content">
                <h2>{{ item.name }}</h2>

                <p>
                  {{ item.category }} · {{ item.quantity }} {{ item.unit }}
                </p>

                <p>
                  MHD: {{ item.expiryDate || 'Kein Datum' }}
                </p>
              </div>

              <IonChip
                :color="item.bought ? 'success' : 'warning'"
                class="status-chip"
              >
                {{ item.bought ? 'Erledigt' : 'Offen' }}
              </IonChip>
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

      <div v-else class="empty-state">
        <IonIcon :icon="cartOutline" />
        <p>Keine Produkte in dieser Ansicht vorhanden.</p>
      </div>
    </section>

    <IonFab slot="fixed" class="shopping-fab">
      <IonFabButton color="success" @click="showAddModal = true">
        <IonIcon :icon="addOutline" />
      </IonFabButton>
    </IonFab>

    <IonModal
      :is-open="showAddModal"
      class="add-item-modal"
      @didDismiss="showAddModal = false"
    >
      <IonHeader class="ion-no-border">
        <IonToolbar>
          <IonTitle>Artikel hinzufügen</IonTitle>

          <IonButtons slot="end">
            <IonButton
              color="medium"
              aria-label="Dialog schließen"
              @click="showAddModal = false"
            >
              <IonIcon :icon="closeOutline" slot="icon-only" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent
        :scroll-y="true"
        class="add-item-content"
      >
        <div class="modal-content add-item-modal-content">
          <p class="add-item-description">
            Produkte aus dem Bestand zur Einkaufsliste verschieben.
          </p>

          <div class="modal-stack">
            <div class="modal-card">
              <div class="modal-section-label">
                Manueller Artikel
              </div>

              <div class="form-grid">
                <div class="form-field">
                  <label>Name</label>
                  <IonInput
                    v-model="manualName"
                    fill="outline"
                    placeholder="z. B. Haferflocken"
                  />
                </div>

                <div class="two-column-fields">
                  <div class="form-field">
                    <label>Menge</label>
                    <IonInput
                      v-model="manualQuantity"
                      type="number"
                      inputmode="numeric"
                      min="1"
                      fill="outline"
                    />
                  </div>

                  <div class="form-field">
                   
                    <IonSelect
                      v-model="manualCategory"
                      label="Kategorie"
                      interface="action-sheet"
                      cancel-text="Abbrechen"
                    >
                      <IonSelectOption
                        v-for="category in categories"
                        :key="category"
                        :value="category"
                      >
                        {{ category }}
                      </IonSelectOption>
                    </IonSelect>
                  </div>
                </div>

                <div class="modal-primary-action">
                  <IonButton
                    color="success"
                    :disabled="!manualName.trim()"
                    @click="addManualShoppingItem"
                  >
                    <IonIcon :icon="addOutline" slot="start" />
                    Hinzufügen
                  </IonButton>
                </div>
              </div>
            </div>

            <div
              v-if="groceryStore.availableForShoppingList.length === 0"
              class="empty-state modal-empty-state"
            >
              <IonIcon :icon="checkmarkOutline" />
              <p>
                Alle verfügbaren Produkte befinden sich bereits in der Einkaufsliste.
              </p>
            </div>

            <IonList v-else lines="none" class="available-list">
              <IonItem
                v-for="item in groceryStore.availableForShoppingList"
                :key="item.id"
                lines="none"
                class="available-item"
              >
                <div class="available-item-layout">
                  <div class="available-item-content">
                    <strong>{{ item.name }}</strong>
                    <span>
                      {{ item.category }} · {{ item.quantity }} {{ item.unit }}
                    </span>
                  </div>

                  <IonButton
                    size="small"
                    color="success"
                    @click="addAvailableItem(item.id)"
                  >
                    <IonIcon :icon="addOutline" slot="start" />
                    Hinzufügen
                  </IonButton>
                </div>
              </IonItem>
            </IonList>

            <div class="modal-scroll-spacer" aria-hidden="true" />
          </div>
        </div>
      </IonContent>
    </IonModal>

    <IonModal :is-open="showBoughtModal" class="bought-modal" @didDismiss="closeBoughtDialog">
      <IonHeader class="bought-modal__header ion-no-border">
        <IonToolbar>
          <IonTitle>Produkt gekauft</IonTitle>

          <IonButtons slot="end">
            <IonButton fill="clear" color="medium" aria-label="Dialog schließen" @click="closeBoughtDialog">
              <IonIcon :icon="closeOutline" slot="icon-only" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent :scroll-y="true" class="bought-modal__content">
        <div class="bought-modal__inner">
          <div
            v-if="selectedBoughtItem"
            class="selected-product-card"
          >
            <strong>{{ selectedBoughtItem.name }}</strong>
            <span>
              {{ selectedBoughtItem.category }} ·
              {{ selectedBoughtItem.quantity }} {{ selectedBoughtItem.unit }}
            </span>
          </div>

          <div class="modal-card inventory-card">
            <div class="inventory-title">
              In Vorrat übernehmen
            </div>

            <div class="form-grid">
              <label class="form-field">
                <span>Menge</span>
                <IonInput
                  v-model="boughtQuantity"
                  type="number"
                  inputmode="numeric"
                  min="1"
                  fill="outline"
                />
              </label>

              <label class="form-field">
                <span>Neues Ablaufdatum</span>
                <IonDatetime
                  v-model="boughtExpiryDate"
                  presentation="date"
                  class="expiry-picker"
                />
              </label>

              <IonText color="medium">
                <p class="modal-note">
                  Wenn du den Artikel übernimmst, werden Menge und Ablaufdatum im Inventar aktualisiert.
                </p>
              </IonText>
            </div>
          </div>
        </div>
      </IonContent>

      <IonFooter class="bought-modal__footer ion-no-border">
        <IonToolbar class="bought-modal__footer-toolbar">
          <div class="modal-footer-actions bought-modal-actions">
            <IonButton fill="outline" color="medium" @click="markOnlyAsBought">
              Nur erledigt
            </IonButton>

            <IonButton color="success" @click="addToInventory">
              <IonIcon :icon="bagCheckOutline" slot="start" />
              In Vorrat übernehmen
            </IonButton>
          </div>
        </IonToolbar>
      </IonFooter>
    </IonModal>
      </main>
    </IonContent>
  </IonPage>
</template>

<style scoped>
.shopping-header {
  display: flex;
  flex-direction: column;
  gap: var(--app-section-gap);
}

.page-heading h1 {
  margin: 0;
  color: var(--ion-text-color, var(--p-text-color));
  font-size: clamp(1.75rem, 7vw, 2rem);
  font-weight: 750;
  letter-spacing: -0.025em;
  line-height: 1.08;
}

.page-heading p {
  margin: 0.35rem 0 0;
  color: var(--ion-color-medium, var(--p-text-muted-color));
  font-size: 0.875rem;
  line-height: 1.4;
}

.summary-card {
  margin: 0;
  overflow: hidden;
  border: 1px solid var(--sg-border);
  border-radius: 1rem;
  background: var(--sg-surface);
  box-shadow: 0 0.15rem 0.55rem rgba(15, 23, 42, 0.07);
}

.summary-card IonCardContent {
  padding: var(--app-card-padding) 0.35rem;
}

.summary-cell {
  min-width: 0;
  padding: 0.25rem 0.4rem;
  text-align: center;
}

.summary-cell--divided {
  border-inline-start: 1px solid var(--sg-border);
}

.summary-label {
  display: block;
  overflow: hidden;
  color: var(--ion-color-medium, var(--p-text-muted-color));
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.055em;
  line-height: 1.2;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.summary-value {
  display: block;
  margin-top: 0.35rem;
  color: var(--ion-text-color, var(--p-text-color));
  font-size: 1.35rem;
  font-weight: 750;
  line-height: 1;
}

.filter-area {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.freshflow-segment {
  width: 100%;
  min-height: 2.85rem;
  padding: 0.2rem;
  border-radius: 0.9rem;
  background: var(--sg-surface);
}

.freshflow-segment IonSegmentButton {
  min-height: 2.45rem;
  --border-radius: 0.7rem;
  --indicator-color: var(--ion-color-primary);
  --color: var(--ion-color-medium);
  --color-checked: var(--ion-color-primary);
}

.clear-action {
  min-height: 2rem;
  text-align: end;
}

.clear-action IonButton {
  height: auto;
  margin: 0;
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: none;
}

.shopping-list-section {
  margin-top: 0.15rem;
}

.shopping-list {
  padding: 0;
  background: transparent;
}

.shopping-sliding-item {
  margin-bottom: 0.7rem;
  overflow: hidden;
  border: 1px solid var(--sg-border);
  border-radius: 1rem;
  background: var(--sg-surface);
  box-shadow: 0 0.15rem 0.55rem rgba(15, 23, 42, 0.06);
}

.shopping-item-shell {
  --padding-start: 0;
  --inner-padding-end: 0;
  --inner-padding-top: 0;
  --inner-padding-bottom: 0;
  --background: transparent;
  --min-height: auto;
}

.shopping-item-layout {
  display: grid;
  width: 100%;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: start;
  gap: 0.7rem;
  padding: 0.85rem 0.85rem 0.85rem 0.75rem;
}

.shopping-checkbox {
  margin: 0.15rem 0 0;
  flex-shrink: 0;
}

.shopping-item-content {
  min-width: 0;
}

.shopping-item-content h2 {
  margin: 0;
  overflow: hidden;
  color: var(--ion-text-color, var(--p-text-color));
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.25;
  text-align: start;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.shopping-item-content p {
  margin: 0.25rem 0 0;
  overflow-wrap: anywhere;
  color: var(--ion-color-medium, var(--p-text-muted-color));
  font-size: 0.79rem;
  line-height: 1.3;
  text-align: start;
}

.status-chip {
  height: 1.8rem;
  margin: 0;
  align-self: start;
  flex-shrink: 0;
  font-size: 0.72rem;
  white-space: nowrap;
}

.empty-state {
  padding: clamp(1.5rem, 3vw, 2.25rem) var(--app-card-padding);
  border: 1px dashed var(--sg-border);
  border-radius: 1rem;
  background: var(--sg-surface);
  color: var(--ion-color-medium, var(--p-text-muted-color));
  text-align: center;
}

.empty-state IonIcon {
  margin-bottom: 0.65rem;
  color: var(--sg-primary);
  font-size: 2.4rem;
}

.empty-state p {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.45;
}

.shopping-fab {
  position: fixed;
  inset-inline-end: max(
    var(--app-page-gutter),
    calc((100vw - var(--app-content-max-width)) / 2 + var(--app-page-gutter))
  );
  bottom: calc(
    var(--app-tab-bar-height) + var(--app-page-gutter) + var(--ion-safe-area-bottom, 0px)
  );
  z-index: 30;
}


.add-item-modal {
  --width: 100%;
  --height: 100%;
}

.add-item-content {
  --background: var(--sg-background);
  --padding-top: 0;
  --padding-bottom: var(--ion-safe-area-bottom, 0px);
}

.add-item-content::part(scroll) {
  overscroll-behavior-y: contain;
}

.add-item-modal-content {
  min-height: 100%;
}

.add-item-description {
  margin: 0 0 1rem;
  color: var(--ion-color-medium, var(--p-text-muted-color));
  font-size: 0.86rem;
  line-height: 1.4;
}

.modal-scroll-spacer {
  height: calc(1rem + var(--ion-safe-area-bottom, 0px));
  flex: 0 0 auto;
}

.modal-content {
  width: min(100%, 34rem);
  margin: 0 auto;
  padding:
    1rem
    1rem
    calc(1rem + var(--ion-safe-area-bottom, 0px));
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.modal-header h2 {
  margin: 0;
  color: var(--ion-text-color, var(--p-text-color));
  font-size: 1.25rem;
  font-weight: 750;
}

.modal-header p {
  margin: 0.3rem 0 0;
  color: var(--ion-color-medium, var(--p-text-muted-color));
  font-size: 0.86rem;
  line-height: 1.4;
}

.modal-header IonButton {
  margin: -0.4rem -0.5rem 0 0;
}

.modal-stack,
.form-grid {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.modal-card,
.selected-product-card {
  padding: 1rem;
  border: 1px solid var(--sg-border);
  border-radius: 1rem;
  background: var(--sg-surface);
  box-shadow: 0 0.15rem 0.55rem rgba(15, 23, 42, 0.06);
}

.modal-section-label {
  margin-bottom: 0.8rem;
  color: var(--ion-color-medium, var(--p-text-muted-color));
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.055em;
  text-transform: uppercase;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  color: var(--ion-text-color, var(--p-text-color));
  font-size: 0.86rem;
  font-weight: 600;
}

.two-column-fields {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.9rem;
}

.modal-primary-action {
  display: flex;
  justify-content: stretch;
}

.modal-primary-action IonButton {
  width: 100%;
  margin: 0;
}

.available-list {
  padding: 0;
  background: transparent;
}

.available-item {
  margin-bottom: 0.65rem;
  overflow: hidden;
  border: 1px solid var(--sg-border);
  border-radius: 1rem;
  background: var(--sg-surface);
  box-shadow: 0 0.15rem 0.55rem rgba(15, 23, 42, 0.05);
  --padding-start: 0;
  --inner-padding-end: 0;
}

.available-item-layout {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.7rem 0.75rem;
}

.available-item-content {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 0.2rem;
}

.available-item-content strong {
  overflow: hidden;
  color: var(--ion-text-color, var(--p-text-color));
  font-size: 0.95rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.available-item-content span,
.selected-product-card span {
  color: var(--ion-color-medium, var(--p-text-muted-color));
  font-size: 0.8rem;
  line-height: 1.35;
}

.available-item IonButton {
  flex-shrink: 0;
  margin: 0;
}

.modal-empty-state {
  padding-block: 2rem;
}

.selected-product-card {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.inventory-card {
  margin-top: 1rem;
}

.inventory-title {
  margin-bottom: 0.8rem;
  color: var(--ion-text-color, var(--p-text-color));
  font-size: 0.9rem;
  font-weight: 700;
}

.expiry-picker {
  border: 1px solid var(--sg-border);
  border-radius: 1rem;
  background: var(--sg-background);
}

.modal-note {
  margin: 0;
  font-size: 0.83rem;
  line-height: 1.45;
}

.modal-footer-actions {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  margin-top: 1rem;
}

.modal-footer-actions IonButton {
  width: 100%;
  margin: 0;
}

.bought-modal {
  --width: 100%;
  --height: 100%;
}

.bought-modal__header ion-toolbar {
  --background: var(--sg-surface);
  --border-color: var(--sg-border);
}

.bought-modal__content {
  --background: var(--sg-background);
  --padding-top: 0;
  --padding-bottom: 0;
}

.bought-modal__content::part(scroll) {
  padding-bottom: calc(1rem + var(--ion-safe-area-bottom, 0px));
}

.bought-modal__inner {
  width: min(100%, 34rem);
  margin: 0 auto;
  padding: var(--app-page-gutter) var(--app-page-gutter) 0;
}

.bought-modal__footer {
  background: var(--sg-surface);
}

.bought-modal__footer-toolbar {
  --background: var(--sg-surface);
  --border-color: var(--sg-border);
  --padding-start: var(--app-page-gutter);
  --padding-end: var(--app-page-gutter);
  --padding-top: 0.75rem;
  --padding-bottom: calc(0.75rem + var(--ion-safe-area-bottom, 0px));
}

.bought-modal-actions {
  margin-top: 0;
}

.bought-modal-actions IonButton {
  flex: 1 1 0;
}

@media (min-width: 36rem) {
  .bought-modal-actions {
    flex-direction: row;
  }
}

@media (min-width: 36rem) {

  .add-item-modal {
    --width: min(34rem, calc(100vw - 2rem));
    --height: min(48rem, calc(100vh - 2rem));
    --border-radius: 1rem;
  }

  .shopping-page {
    padding-inline: 1rem;
  }

  .two-column-fields {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .modal-primary-action {
    justify-content: flex-end;
  }

  .modal-primary-action IonButton {
    width: auto;
  }

  .modal-footer-actions {
    flex-direction: row;
    justify-content: flex-end;
  }

  .modal-footer-actions IonButton {
    width: auto;
  }
}

@media (max-width: 24rem) {
  .shopping-item-layout {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .status-chip {
    grid-column: 2;
    justify-self: start;
  }
}
</style>
