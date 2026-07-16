<script setup lang="ts">
import { computed } from 'vue'
import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonChip,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonProgressBar,
  IonText
} from '@ionic/vue'
import { useGroceryStore } from '@/stores/groceryStore'
import type { GroceryItem } from '@/stores/groceryStore'
import { getExpiryInfo, getProductExpiryDate } from '@/utils/expiryUtils'
import type { ExpiryInfo } from '@/utils/expiryUtils'

const groceryStore = useGroceryStore()

function getItemExpiry(item: GroceryItem): ExpiryInfo {
  return getExpiryInfo(getProductExpiryDate(item as unknown as Record<string, unknown>))
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
  <main class="w-full">
    <section class="mb-6">
      <IonCard class="m-0">
        <IonCardHeader class="px-4 pt-4 pb-3">
          <IonCardTitle class="text-xl"> Dashboard</IonCardTitle>
          <IonCardSubtitle>
          </IonCardSubtitle>
        </IonCardHeader>
        <IonCardContent class="px-4 pt-0 pb-4">
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <IonCard class="text-center m-0 shadow-none stat-card">
              <IonCardHeader class="px-4 pt-4 pb-2">
                <IonCardTitle class="text-base">Inventar</IonCardTitle>
              </IonCardHeader>
              <IonCardContent class="px-4 pt-0 pb-4">
                <div class="text-5xl font-bold text-color leading-none mb-2">{{ groceryStore.totalItems }}</div>
                <div class="text-sm text-muted-color">Lebensmittel im Inventar</div>
              </IonCardContent>
            </IonCard>

            <IonCard class="text-center m-0 shadow-none stat-card">
              <IonCardHeader class="px-4 pt-4 pb-2">
                <IonCardTitle class="text-base">Frisch</IonCardTitle>
              </IonCardHeader>
              <IonCardContent class="px-4 pt-0 pb-4">
                <div class="text-5xl font-bold text-color leading-none mb-2">{{ freshCount }}</div>
                <div class="text-sm text-muted-color">
                  <IonChip color="success" class="m-0">
                    <IonLabel>Frisch</IonLabel>
                  </IonChip>
                </div>
              </IonCardContent>
            </IonCard>

            <IonCard class="text-center m-0 shadow-none stat-card">
              <IonCardHeader class="px-4 pt-4 pb-2">
                <IonCardTitle class="text-base">Bald ablaufend</IonCardTitle>
              </IonCardHeader>
              <IonCardContent class="px-4 pt-0 pb-4">
                <div class="text-5xl font-bold text-color leading-none mb-2">{{ soonCount }}</div>
                <div class="text-sm text-muted-color">
                  <IonChip color="warning" class="m-0">
                    <IonLabel>Bald ablaufend</IonLabel>
                  </IonChip>
                </div>
              </IonCardContent>
            </IonCard>

            <IonCard class="text-center m-0 shadow-none stat-card">
              <IonCardHeader class="px-4 pt-4 pb-2">
                <IonCardTitle class="text-base">Abgelaufen</IonCardTitle>
              </IonCardHeader>
              <IonCardContent class="px-4 pt-0 pb-4">
                <div class="text-5xl font-bold text-color leading-none mb-2">{{ expiredCount }}</div>
                <div class="text-sm text-muted-color">
                  <IonChip color="danger" class="m-0">
                    <IonLabel>Abgelaufen</IonLabel>
                  </IonChip>
                </div>
              </IonCardContent>
            </IonCard>
          </div>
        </IonCardContent>
      </IonCard>
    </section>

    <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      <IonCard class="m-0">
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
                <h3 class="font-semibold text-color">{{ item.name }}</h3>
                <p class="text-sm text-muted-color">{{ item.category }} · {{ item.quantity }} {{ item.unit }}</p>
              </IonLabel>
              <IonChip color="primary" class="m-0">
                <IonLabel>Favorit</IonLabel>
              </IonChip>
            </IonItem>
          </IonList>
          <IonText v-else color="medium">
            <p class="m-0">Noch keine Favoriten vorhanden.</p>
          </IonText>
        </IonCardContent>
      </IonCard>

      <IonCard class="m-0">
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
                <h3 class="font-semibold text-color">{{ item.name }}</h3>
                <p class="text-sm text-muted-color">{{ item.expiryDate }}</p>
              </IonLabel>
              <IonChip
                class="m-0"
                :color="getItemExpiry(item).severity === 'success' ? 'success' : getItemExpiry(item).severity === 'warn' ? 'warning' : 'danger'"
              >
                <IonLabel>{{ getItemExpiry(item).label }}</IonLabel>
              </IonChip>
            </IonItem>
          </IonList>
          <IonText v-else color="medium">
            <p class="m-0">Keine bald ablaufenden Produkte.</p>
          </IonText>
        </IonCardContent>
      </IonCard>

      <IonCard class="m-0">
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
                <h3 class="font-semibold text-color">{{ item.name }}</h3>
                <p class="text-sm text-muted-color">{{ item.expiryDate }}</p>
              </IonLabel>
              <IonChip color="danger" class="m-0">
                <IonLabel>Abgelaufen</IonLabel>
              </IonChip>
            </IonItem>
          </IonList>
          <IonText v-else color="medium">
            <p class="m-0">Keine abgelaufenen Produkte. ✓</p>
          </IonText>
        </IonCardContent>
      </IonCard>
    </section>

    <section class="mb-6">
      <IonCard class="w-full m-0">
        <IonCardHeader class="px-4 pt-4 pb-3">
          <IonCardTitle class="text-lg flex items-center gap-2">
            <span class="text-xl leading-none">☁</span>
            Wetter
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent class="px-4 pt-0 pb-4">
          <div class="flex flex-col gap-3">
            <div class="flex items-center gap-4">
              <span class="text-[2.5rem] leading-none text-sky-500">☔</span>
              <div class="flex flex-col gap-[0.15rem]">
                <span class="text-[1.75rem] font-bold text-color leading-none">{{ shoppingWeather.temperature }}°C</span>
                <span class="text-[0.9rem] text-muted-color">{{ shoppingWeather.condition }}</span>
              </div>
            </div>
            <IonNote class="weather-note">{{ shoppingWeather.hint }}</IonNote>
          </div>
        </IonCardContent>
      </IonCard>
    </section>

    <section class="mb-6">
      <IonCard class="w-full m-0">
        <IonCardHeader class="px-4 pt-4 pb-3">
          <IonCardTitle class="text-lg">Häufig gekaufte Produkte</IonCardTitle>
          <IonCardSubtitle>Aus Einkaufsliste und gekennzeichneten Käufen abgeleitet.</IonCardSubtitle>
        </IonCardHeader>
        <IonCardContent class="px-4 pt-0 pb-4">
          <template v-if="productMixStats.total > 0">
            <div class="flex flex-col gap-4">
              <div class="flex flex-wrap items-center gap-2 text-sm text-muted-color">
                <span>Ausgewertete Produkte:</span>
                <strong class="text-color">{{ productMixStats.total }}</strong>
              </div>

              <div class="flex h-3 overflow-hidden rounded-full bg-[var(--p-surface-200, #e5e7eb)]">
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
                  class="m-0 shadow-none mix-item-card"
                >
                  <IonCardContent class="p-0">
                    <IonItem lines="none" class="mix-item" :detail="false">
                      <IonLabel class="ion-text-wrap">
                        <h3 class="font-semibold text-color">{{ item.name }}</h3>
                        <p class="text-sm text-muted-color">{{ item.count }} Einträge</p>
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
            <p class="m-0">Noch keine Produktdaten vorhanden.</p>
          </IonText>
        </IonCardContent>
      </IonCard>
    </section>

    <section class="mb-6 flex justify-start">
      <IonButton router-link="/dashboard" fill="outline" color="primary">
        Zur PrimeVue Dashboard-Version
      </IonButton>
    </section>
  </main>
</template>

<style scoped>
.weather-note {
  display: block;
  padding: 0.5rem 0.75rem;
  border-left: 3px solid #4b9cd3;
  background: var(--p-surface-100, #f3f4f6);
  border-radius: 0.375rem;
  color: #374151;
  line-height: 1.5;
}

.stat-card {
  --background: var(--p-surface-0, #ffffff);
}

.mix-list {
  display: grid;
  gap: 0.75rem;
}

.mix-item-card {
  --background: var(--p-surface-0, #ffffff);
}

:deep(ion-card) {
  --background: var(--p-surface-0, #ffffff);
}

:deep(ion-item::part(native)) {
  padding-left: 0;
  padding-right: 0;
}

:deep(ion-progress-bar) {
  --background: var(--p-surface-200, #e5e7eb);
}

:deep(ion-list.bg-transparent) {
  background: transparent;
}

:deep(.mix-item::part(native)) {
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
}
</style>