<script setup lang="ts">
import { computed } from 'vue'
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import ProgressBar from 'primevue/progressbar'
import { RouterLink } from 'vue-router'
import { useGroceryStore } from '@/stores/groceryStore'
import type { GroceryItem } from '@/stores/groceryStore'
import { getExpiryInfo, getProductExpiryDate } from '@/utils/expiryUtils'
import type { ExpiryInfo } from '@/utils/expiryUtils'

const groceryStore = useGroceryStore()

/** Helper so templates never call getExpiryInfo twice per item. */
function getItemExpiry(item: GroceryItem): ExpiryInfo {
  return getExpiryInfo(getProductExpiryDate(item as unknown as Record<string, unknown>))
}

/** All items enriched with their current ExpiryInfo (reactive). */
const productsWithExpiry = computed(() =>
  groceryStore.items.map(item => ({ item, expiry: getItemExpiry(item) }))
)

/** Stat counts derived from getExpiryInfo – aligned with the 5-state model. */
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

/** Products that expire today or within the warning window (status today | soon). */
const soonExpiringItems = computed(() =>
  productsWithExpiry.value
    .filter(p => p.expiry.status === 'today' || p.expiry.status === 'soon')
    .map(p => p.item)
)

/** Products whose expiry date is already in the past (status expired). */
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
  icon: 'pi pi-cloud-rain',
  hint: 'Es regnet heute. Nimm einen Regenschirm mit, wenn du einkaufen gehst.'
}
</script>

<template>
  <main class="w-full">
    <section class="mb-6">
      <h1 class="m-0 text-4xl font-bold text-color">Dashboard</h1>
    </section>

    <section class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card class="text-center">
        <template #content>
          <div class="text-5xl font-bold text-color leading-none mb-2">{{ groceryStore.totalItems }}</div>
          <div class="text-sm text-muted-color">Lebensmittel im Inventar</div>
        </template>
      </Card>

      <Card class="text-center">
        <template #content>
          <div class="text-5xl font-bold text-color leading-none mb-2">{{ freshCount }}</div>
          <div class="text-sm text-muted-color">
            <Tag value="Frisch" severity="success" />
          </div>
        </template>
      </Card>

      <Card class="text-center">
        <template #content>
          <div class="text-5xl font-bold text-color leading-none mb-2">{{ soonCount }}</div>
          <div class="text-sm text-muted-color">
            <Tag value="Bald ablaufend" severity="warn" />
          </div>
        </template>
      </Card>

      <Card class="text-center">
        <template #content>
          <div class="text-5xl font-bold text-color leading-none mb-2">{{ expiredCount }}</div>
          <div class="text-sm text-muted-color">
            <Tag value="Abgelaufen" severity="danger" />
          </div>
        </template>
      </Card>
    </section>

    <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      <Card>
        <template #title>Favoriten</template>
        <template #content>
          <template v-if="groceryStore.favoriteItems.length > 0">
            <ul class="list-none m-0 p-0 flex flex-col gap-3">
              <li
                v-for="item in groceryStore.favoriteItems"
                :key="item.id"
                class="flex items-center justify-between gap-2"
              >
                <span class="flex flex-col gap-[0.15rem]">
                  <strong>{{ item.name }}</strong>
                  <span class="text-[0.8rem] text-muted-color">{{ item.category }} · {{ item.quantity }} {{ item.unit }}</span>
                </span>
                <Tag value="Favorit" severity="info" />
              </li>
            </ul>
          </template>
          <p v-else class="m-0 text-muted-color">Noch keine Favoriten vorhanden.</p>
        </template>
      </Card>

      <!-- Bald ablaufend: status 'today' oder 'soon' (days 0–3) -->
      <Card>
        <template #title>Bald ablaufende Produkte</template>
        <template #content>
          <template v-if="soonExpiringItems.length > 0">
            <ul class="list-none m-0 p-0 flex flex-col gap-3">
              <li
                v-for="item in soonExpiringItems"
                :key="item.id"
                class="flex items-center justify-between gap-2"
              >
                <span class="flex flex-col gap-[0.15rem]">
                  <strong>{{ item.name }}</strong>
                  <span class="text-[0.8rem] text-muted-color">{{ item.expiryDate }}</span>
                </span>
                <Tag
                  :value="getItemExpiry(item).label"
                  :severity="getItemExpiry(item).severity"
                />
              </li>
            </ul>
          </template>
          <p v-else class="m-0 text-muted-color">Keine bald ablaufenden Produkte.</p>
        </template>
      </Card>

      <!-- Bereits abgelaufen: status 'expired' (days < 0) -->
      <Card>
        <template #title>Abgelaufene Produkte</template>
        <template #content>
          <template v-if="expiredItems.length > 0">
            <ul class="list-none m-0 p-0 flex flex-col gap-3">
              <li
                v-for="item in expiredItems"
                :key="item.id"
                class="flex items-center justify-between gap-2"
              >
                <span class="flex flex-col gap-[0.15rem]">
                  <strong>{{ item.name }}</strong>
                  <span class="text-[0.8rem] text-muted-color">{{ item.expiryDate }}</span>
                </span>
                <Tag value="Abgelaufen" severity="danger" />
              </li>
            </ul>
          </template>
          <p v-else class="m-0 text-muted-color">Keine abgelaufenen Produkte. ✓</p>
        </template>
      </Card>
    </section>

    <!-- Einkaufswetter -->
    <section class="mb-6">
      <Card class="w-full">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-sun" />
            Wetter
          </div>
        </template>
        <template #content>
          <div class="flex flex-col gap-3">
            <div class="flex items-center gap-4">
              <i :class="shoppingWeather.icon" class="text-[2.5rem] text-[#4b9cd3]" />
              <div class="flex flex-col gap-[0.15rem]">
                <span class="text-[1.75rem] font-bold text-color leading-none">{{ shoppingWeather.temperature }}°C</span>
                <span class="text-[0.9rem] text-muted-color">{{ shoppingWeather.condition }}</span>
              </div>
            </div>
            <p class="weather-hint">{{ shoppingWeather.hint }}</p>
          </div>
        </template>
      </Card>
    </section>

    <section class="mb-6">
      <Card class="w-full">
        <template #title>Häufig gekaufte Produkte</template>
        <template #subtitle>Aus Einkaufsliste und gekennzeichneten Käufen abgeleitet.</template>
        <template #content>
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
                  :class="[
                    index === 0 ? 'bg-emerald-500' : index === 1 ? 'bg-lime-500' : index === 2 ? 'bg-amber-500' : index === 3 ? 'bg-sky-500' : 'bg-slate-400'
                  ]"
                  :style="{ width: `${item.percentage}%` }"
                  :title="`${item.name}: ${item.percentage}%`"
                />
              </div>

              <div class="grid gap-3 md:grid-cols-2">
                <div
                  v-for="(item, index) in productMixStats.items"
                  :key="`${item.name}-${index}`"
                  class="rounded-[var(--sg-radius-md)] border border-[var(--sg-border)] bg-[var(--sg-surface-2)] p-3"
                >
                  <div class="flex items-center justify-between gap-2 mb-2">
                    <div class="font-semibold text-color">{{ item.name }}</div>
                    <div class="text-sm text-muted-color">{{ item.percentage }}%</div>
                  </div>
                  <ProgressBar :value="item.percentage" class="product-progress" />
                  <div class="mt-2 text-sm text-muted-color">{{ item.count }} Einträge</div>
                </div>
              </div>
            </div>
          </template>
          <p v-else class="m-0 text-muted-color">Noch keine Produktdaten vorhanden.</p>
        </template>
      </Card>
    </section>

  </main>
</template>

<style scoped>
/* ── Weather Hint (border-left accent, kept intentionally) ── */
.weather-hint {
  margin: 0;
  font-size: 0.875rem;
  color: #374151;
  background-color: var(--p-surface-100, #f3f4f6);
  border-left: 3px solid #4b9cd3;
  border-radius: 4px;
  padding: 0.5rem 0.75rem;
  line-height: 1.5;
}

/* ── Product mix stats ───────────────────────────────────── */
.product-progress :deep(.p-progressbar-value) {
  background: var(--sg-primary, #16a34a);
}

/* ── Mobile ─────────────────────────────────────────────── */
@media (max-width: 650px) {
  .product-progress :deep(.p-progressbar-value) {
    background: var(--sg-primary, #16a34a);
  }
}
</style>
