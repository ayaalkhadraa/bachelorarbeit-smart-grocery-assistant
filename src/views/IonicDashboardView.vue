<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonChip,
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonProgressBar,
  IonPage,
  IonText
} from '@ionic/vue'
import { checkmarkCircleOutline, alertCircleOutline, timeOutline, walletOutline } from 'ionicons/icons'
import { useGroceryStore } from '@/stores/groceryStore'
import type { GroceryItem } from '@/stores/groceryStore'
import { getExpiryInfo, getProductExpiryDate } from '@/utils/expiryUtils'
import type { ExpiryInfo } from '@/utils/expiryUtils'
import IonicPageHeader from '@/components/ionic/IonicPageHeader.vue'
import { logout } from '@/utils/logout'

const groceryStore = useGroceryStore()
const router = useRouter()

function getItemExpiry(item: GroceryItem): ExpiryInfo {
  return getExpiryInfo(getProductExpiryDate(item as unknown as Record<string, unknown>))
}

function handleLogout(): void {
  logout(router)
}

const productsWithExpiry = computed(() =>
  groceryStore.items.map(item => ({ item, expiry: getItemExpiry(item) }))
)

const freshCount = computed(() =>
  productsWithExpiry.value.filter(p => p.expiry.status === 'fresh').length
)
const soonCount = computed(() =>
  productsWithExpiry.value.filter(
    p => p.expiry.status === 'today' || p.expiry.status === 'soon'
  ).length
)
const expiredCount = computed(() =>
  productsWithExpiry.value.filter(p => p.expiry.status === 'expired').length
)

const soonExpiringItems = computed(() =>
  productsWithExpiry.value
    .filter(p => p.expiry.status === 'today' || p.expiry.status === 'soon')
    .map(p => p.item)
)

const expiredItems = computed(() =>
  productsWithExpiry.value
    .filter(p => p.expiry.status === 'expired')
    .map(p => p.item)
)

const totalInventoryCount = computed(() => groceryStore.totalItems)

type StatAccent = 'fresh' | 'soon' | 'expired' | 'inventory'

const statAccentConfig: Record<StatAccent, { icon: string; className: string; label: string }> = {
  inventory: { icon: walletOutline, className: 'dashboard-stat-indicator--inventory', label: 'Inventar' },
  fresh: { icon: checkmarkCircleOutline, className: 'dashboard-stat-indicator--fresh', label: 'Frisch' },
  soon: { icon: timeOutline, className: 'dashboard-stat-indicator--soon', label: 'Bald ablaufend' },
  expired: { icon: alertCircleOutline, className: 'dashboard-stat-indicator--expired', label: 'Abgelaufen' },
}

function getStatSummary(count: number): string {
  return `${count} von ${totalInventoryCount.value} Produkten`
}

const productMixSourceItems = computed(() => {
  const currentItems = groceryStore.items.filter((item) => item.inShoppingList || item.bought)
  return currentItems.length > 0 ? currentItems : groceryStore.items
})

type ProductMixStat = {
  name: string
  count: number
  percentage: number
}

const productMixStats = computed(() => {
  const counts = new Map<string, number>()

  productMixSourceItems.value.forEach((item) => {
    const key = item.name.trim() || 'Unbenannt'
    counts.set(key, (counts.get(key) ?? 0) + 1)
  })

  const total = Array.from(counts.values()).reduce((sum, count) => sum + count, 0)

  if (total === 0) {
    return { total: 0, items: [] as ProductMixStat[] }
  }

  const sorted = Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'de'))

  const topEntries = sorted.slice(0, 4)
  const restCount = sorted.slice(4).reduce((sum, entry) => sum + entry.count, 0)

  if (restCount > 0) {
    topEntries.push({ name: 'Sonstiges', count: restCount })
  }

  return {
    total,
    items: topEntries.map((entry) => ({
      name: entry.name,
      count: entry.count,
      percentage: Math.round((entry.count / total) * 100),
    })),
  }
})

const shoppingWeather = {
  temperature: 12,
  condition: 'Regen',
  icon: 'rainy-outline',
  hint: 'Es regnet heute. Nimm einen Regenschirm mit, wenn du einkaufen gehst.'
}

const mixBarColors = ['#16a34a', '#0f766e', '#f59e0b', '#0ea5e9', '#9ca3af'] as const

function getMixBarColor(index: number): string {
  return mixBarColors[index] ?? '#9ca3af'
}
</script>

<template>
  <IonPage>
    <IonicPageHeader title="Dashboard" @logout="handleLogout" />
    <IonContent :fullscreen="true">
      <main class="app-page-shell app-page-stack">
    <section>
      <IonCard class="dashboard-card m-0">
        <IonCardContent class="px-4 pt-0 pb-4">
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <IonCard class="dashboard-card text-center m-0 shadow-none stat-card">
              <IonCardHeader class="px-4 pt-4 pb-2 dashboard-stat-header dashboard-stat-header--inventory">
                <IonCardTitle class="text-base">Inventar</IonCardTitle>
              </IonCardHeader>
              <IonCardContent class="px-4 pt-0 pb-4">
                <div class="dashboard-number text-5xl font-bold leading-none mb-2">{{ groceryStore.totalItems }}</div>
                <div class="dashboard-stat-secondary dashboard-secondary-text text-sm">
                  <IonIcon :icon="statAccentConfig.inventory.icon" class="dashboard-stat-indicator dashboard-stat-indicator--inventory" aria-hidden="true" />
                  <span>{{ getStatSummary(groceryStore.totalItems) }}</span>
                </div>
              </IonCardContent>
            </IonCard>

            <IonCard class="dashboard-card text-center m-0 shadow-none stat-card">
              <IonCardHeader class="px-4 pt-4 pb-2 dashboard-stat-header dashboard-stat-header--fresh">
                <IonCardTitle class="text-base">Frisch</IonCardTitle>
              </IonCardHeader>
              <IonCardContent class="px-4 pt-0 pb-4">
                <div class="dashboard-number text-5xl font-bold leading-none mb-2">{{ freshCount }}</div>
                <div class="dashboard-stat-secondary dashboard-secondary-text text-sm">
                  <IonIcon :icon="statAccentConfig.fresh.icon" class="dashboard-stat-indicator dashboard-stat-indicator--fresh" aria-hidden="true" />
                  <span>{{ getStatSummary(freshCount) }}</span>
                </div>
              </IonCardContent>
            </IonCard>

            <IonCard class="dashboard-card text-center m-0 shadow-none stat-card">
              <IonCardHeader class="px-4 pt-4 pb-2 dashboard-stat-header dashboard-stat-header--soon">
                <IonCardTitle class="text-base">Bald ablaufend</IonCardTitle>
              </IonCardHeader>
              <IonCardContent class="px-4 pt-0 pb-4">
                <div class="dashboard-number text-5xl font-bold leading-none mb-2">{{ soonCount }}</div>
                <div class="dashboard-stat-secondary dashboard-secondary-text text-sm">
                  <IonIcon :icon="statAccentConfig.soon.icon" class="dashboard-stat-indicator dashboard-stat-indicator--soon" aria-hidden="true" />
                  <span>{{ getStatSummary(soonCount) }}</span>
                </div>
              </IonCardContent>
            </IonCard>

            <IonCard class="dashboard-card text-center m-0 shadow-none stat-card">
              <IonCardHeader class="px-4 pt-4 pb-2 dashboard-stat-header dashboard-stat-header--expired">
                <IonCardTitle class="text-base">Abgelaufen</IonCardTitle>
              </IonCardHeader>
              <IonCardContent class="px-4 pt-0 pb-4">
                <div class="dashboard-number text-5xl font-bold leading-none mb-2">{{ expiredCount }}</div>
                <div class="dashboard-stat-secondary dashboard-secondary-text text-sm">
                  <IonIcon :icon="statAccentConfig.expired.icon" class="dashboard-stat-indicator dashboard-stat-indicator--expired" aria-hidden="true" />
                  <span>{{ getStatSummary(expiredCount) }}</span>
                </div>
              </IonCardContent>
            </IonCard>
          </div>
        </IonCardContent>
      </IonCard>
    </section>
    

    <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <IonCard class="dashboard-card m-0">
        <IonCardHeader class="px-4 pt-4 pb-3">
          <IonCardTitle class="text-lg">Favoriten</IonCardTitle>
        </IonCardHeader>
        <IonCardContent class="px-4 pt-0 pb-4">
          <IonList v-if="groceryStore.favoriteItems.length > 0" lines="none" class="bg-transparent">
            <IonItem
              v-for="item in groceryStore.favoriteItems"
              :key="item.id"
              class="favorite-item"
              :detail="false"
            >
              <IonLabel class="ion-text-wrap">
                <h3 class="font-semibold">{{ item.name }}</h3>
                <p class="dashboard-secondary-text text-sm">{{ item.category }} · {{ item.quantity }} {{ item.unit }}</p>
              </IonLabel>
            </IonItem>
          </IonList>
          <IonText v-else color="medium">
            <p class="dashboard-secondary-text m-0">Noch keine Favoriten vorhanden.</p>
          </IonText>
        </IonCardContent>
      </IonCard>

      <IonCard class="dashboard-card m-0">
        <IonCardHeader class="px-4 pt-4 pb-3">
          <IonCardTitle class="text-lg">Bald ablaufende Produkte</IonCardTitle>
        </IonCardHeader>
        <IonCardContent class="px-4 pt-0 pb-4">
          <IonList v-if="soonExpiringItems.length > 0" lines="none" class="bg-transparent">
            <IonItem
              v-for="item in soonExpiringItems"
              :key="item.id"
              class="expiring-item"
              :detail="false"
            >
              <IonLabel class="ion-text-wrap">
                <h3 class="font-semibold">{{ item.name }}</h3>
                <p class="dashboard-secondary-text text-sm">{{ item.expiryDate }}</p>
              </IonLabel>
            </IonItem>
          </IonList>
          <IonText v-else color="medium">
            <p class="dashboard-secondary-text m-0">Keine bald ablaufenden Produkte.</p>
          </IonText>
        </IonCardContent>
      </IonCard>

      <IonCard class="dashboard-card m-0">
        <IonCardHeader class="px-4 pt-4 pb-3">
          <IonCardTitle class="text-lg">Abgelaufene Produkte</IonCardTitle>
        </IonCardHeader>
        <IonCardContent class="px-4 pt-0 pb-4">
          <IonList v-if="expiredItems.length > 0" lines="none" class="bg-transparent">
            <IonItem
              v-for="item in expiredItems"
              :key="item.id"
              class="expired-item"
              :detail="false"
            >
              <IonLabel class="ion-text-wrap">
                <h3 class="font-semibold">{{ item.name }}</h3>
                <p class="dashboard-secondary-text text-sm">{{ item.expiryDate }}</p>
              </IonLabel>
            </IonItem>
          </IonList>
          <IonText v-else color="medium">
            <p class="dashboard-secondary-text m-0">Keine abgelaufenen Produkte. ✓</p>
          </IonText>
        </IonCardContent>
      </IonCard>
    </section>

    <section>
      <IonCard class="dashboard-card w-full m-0">
        <IonCardHeader class="px-4 pt-4 pb-3">
          <IonCardTitle class="text-lg flex items-center gap-2">
            <span class="dashboard-icon text-xl leading-none">☁</span>
            Wetter
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent class="px-4 pt-0 pb-4">
          <div class="flex flex-col gap-3">
            <div class="flex items-center gap-4">
              <span class="dashboard-icon text-[2.5rem] leading-none">☔</span>
              <div class="flex flex-col gap-[0.15rem]">
                <span class="dashboard-number text-[1.75rem] font-bold leading-none">{{ shoppingWeather.temperature }}°C</span>
                <span class="dashboard-secondary-text text-[0.9rem]">{{ shoppingWeather.condition }}</span>
              </div>
            </div>
            <IonNote class="weather-note">{{ shoppingWeather.hint }}</IonNote>
          </div>
        </IonCardContent>
      </IonCard>
    </section>

    <section>
      <IonCard class="dashboard-card w-full m-0">
        <IonCardHeader class="px-4 pt-4 pb-3">
          <IonCardTitle class="text-lg">Häufig gekaufte Produkte</IonCardTitle>
          <IonCardSubtitle class="dashboard-secondary-text">Aus Einkaufsliste und gekennzeichneten Käufen abgeleitet.</IonCardSubtitle>
        </IonCardHeader>
        <IonCardContent class="px-4 pt-0 pb-4">
          <template v-if="productMixStats.total > 0">
            <div class="flex flex-col gap-4">
              <div class="flex flex-wrap items-center gap-2 text-sm dashboard-secondary-text">
                <span>Ausgewertete Produkte:</span>
                <strong class="dashboard-number">{{ productMixStats.total }}</strong>
              </div>

              <div class="dashboard-track flex h-3 overflow-hidden rounded-full">
                <div
                  v-for="(item, index) in productMixStats.items"
                  :key="item.name"
                  class="h-full"
                  :style="{ width: `${item.percentage}%`, backgroundColor: getMixBarColor(index) }"
                  :title="`${item.name}: ${item.percentage}%`"
                />
              </div>

              <IonList lines="none" class="bg-transparent mix-list">
                <IonCard
                  v-for="(item, index) in productMixStats.items"
                  :key="`${item.name}-${index}`"
                  class="dashboard-card m-0 shadow-none mix-item-card"
                >
                  <IonCardContent class="p-0">
                    <IonItem lines="none" class="mix-item" :detail="false">
                      <IonLabel class="ion-text-wrap">
                        <h3 class="font-semibold">{{ item.name }}</h3>
                        <p class="dashboard-secondary-text text-sm">{{ item.count }} Einträge</p>
                      </IonLabel>
                      <IonChip class="m-0" color="medium">
                        <IonLabel>{{ item.percentage }}%</IonLabel>
                      </IonChip>
                    </IonItem>
                    <div class="px-4 pb-4 pt-0">
                      <IonProgressBar
                        :value="item.percentage / 100"
                        :style="{ '--progress-background': getMixBarColor(index) }"
                      />
                    </div>
                  </IonCardContent>
                </IonCard>
              </IonList>
            </div>
          </template>
          <IonText v-else color="medium">
            <p class="dashboard-secondary-text m-0">Noch keine Produktdaten vorhanden.</p>
          </IonText>
        </IonCardContent>
      </IonCard>
    </section>

      </main>
    </IonContent>
  </IonPage>
</template>

<style scoped>
.dashboard-card {
  --background: var(--dashboard-card-background);
  --ion-card-background: var(--dashboard-card-background);
  --color: var(--ion-text-color);
  width: 100%;
}

.dashboard-number {
  color: var(--dashboard-number-color);
}

.dashboard-icon,
.dashboard-secondary-text {
  color: var(--dashboard-secondary-color);
}

.dashboard-stat-header {
  position: relative;
}

.dashboard-stat-header::before {
  content: '';
  position: absolute;
  inset-inline: 0;
  top: 0;
  height: 3px;
  border-radius: 999px 999px 0 0;
  background: var(--dashboard-secondary-color);
}

.dashboard-stat-header--fresh::before {
  background: var(--ion-color-success);
}

.dashboard-stat-header--soon::before {
  background: var(--ion-color-warning);
}

.dashboard-stat-header--expired::before {
  background: var(--ion-color-danger);
}

.dashboard-stat-header--inventory::before {
  background: var(--ion-color-primary);
}

.dashboard-stat-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  line-height: 1.2;
}

.dashboard-stat-indicator {
  flex: 0 0 auto;
  font-size: 0.95rem;
}

.dashboard-stat-indicator--inventory {
  color: var(--ion-color-primary);
}

.dashboard-stat-indicator--fresh {
  color: var(--ion-color-success);
}

.dashboard-stat-indicator--soon {
  color: var(--ion-color-warning);
}

.dashboard-stat-indicator--expired {
  color: var(--ion-color-danger);
}

.dashboard-track {
  background: var(--ion-color-step-200, var(--ion-background-color));
}

.weather-note {
  display: block;
  padding: 0.5rem 0.75rem;
  border-left: 3px solid var(--ion-color-primary);
  background: var(--ion-background-color);
  border-radius: 0.375rem;
  color: var(--ion-text-color);
  line-height: 1.5;
}

.stat-card {
  width: 100%;
}

.mix-list {
  display: grid;
  gap: var(--app-section-gap);
}

.mix-item-card {
}

:deep(ion-item::part(native)) {
  padding-left: 0;
  padding-right: 0;
}

:deep(ion-progress-bar) {
  --background: var(--ion-color-step-200, var(--ion-background-color));
}

:deep(ion-list.bg-transparent) {
  background: transparent;
}

:deep(.mix-item::part(native)) {
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
}
</style>

<style>
:root {
  --dashboard-card-background: #ffffff;
  --dashboard-number-color: #243247;
  --dashboard-secondary-color: #64748b;
}

@media (prefers-color-scheme: dark) {
  :root {
    --dashboard-card-background: #1e293b;
    --dashboard-number-color: #f8fafc;
    --dashboard-secondary-color: #cbd5e1;
  }
}
</style>