<script setup lang="ts">
import { computed } from 'vue'
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import { RouterLink } from 'vue-router'
import { useGroceryStore } from '@/stores/groceryStore'
import type { GroceryItem } from '@/stores/groceryStore'
import { getExpiryInfo, getProductExpiryDate } from '@/utils/expiryUtils'
import type { ExpiryInfo } from '@/utils/expiryUtils'

const groceryStore = useGroceryStore()

/** Helper so templates never call getExpiryInfo twice per item. */
function getItemExpiry(item: GroceryItem): ExpiryInfo {
  return getExpiryInfo(getProductExpiryDate(item as Record<string, unknown>))
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

const nearestStores = [
  { id: 1, name: 'REWE City', distance: 0.8, open: true,  mapX: 62, mapY: 38 },
  { id: 2, name: 'EDEKA',     distance: 1.4, open: true,  mapX: 42, mapY: 52 },
  { id: 3, name: 'Lidl',      distance: 2.1, open: false, mapX: 72, mapY: 68 },
]

const userPosition = { x: 50, y: 50 }

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

    <!-- Map Preview Card -->
    <section class="mb-6">
      <Card class="w-full">
        <template #title>Einkaufen in der Nähe</template>
        <template #subtitle>Nahegelegene Supermärkte im Überblick.</template>
        <template #content>
          <div class="mini-map-preview">
            <div class="mini-map-grid" />

            <!-- User Marker -->
            <div
              class="mini-map-marker user"
              :style="{ left: userPosition.x + '%', top: userPosition.y + '%' }"
            >
              <i class="pi pi-map-marker" />
              <span class="mini-marker-label">Du</span>
            </div>

            <!-- Store Markers -->
            <div
              v-for="(store, index) in nearestStores"
              :key="store.id"
              class="mini-map-marker store"
              :class="{
                nearest: index === 0,
                'store-open': store.open,
                'store-closed': !store.open
              }"
              :style="{ left: store.mapX + '%', top: store.mapY + '%' }"
            >
              <i class="pi pi-shopping-cart" />
              <span class="mini-marker-label">{{ store.name }}</span>
            </div>
          </div>

          <ul class="nearest-list">
            <li
              v-for="(store, index) in nearestStores"
              :key="store.id"
              class="nearest-store-item"
              :class="{ nearest: index === 0 }"
            >
              <span class="nearest-store-info">
                <span class="nearest-store-name">{{ store.name }}</span>
                <span class="nearest-store-meta">{{ store.distance }} km entfernt</span>
              </span>
              <Tag
                :value="store.open ? 'Geöffnet' : 'Geschlossen'"
                :severity="store.open ? 'success' : 'danger'"
              />
            </li>
          </ul>
        </template>
        <template #footer>
          <div class="flex">
            <RouterLink to="/stores" class="no-underline">
              <Button
                label="Alle Supermärkte anzeigen"
                icon="pi pi-map-marker"
                severity="secondary"
                outlined
              />
            </RouterLink>
          </div>
        </template>
      </Card>
    </section>

    <section class="flex gap-4 flex-wrap">
      <RouterLink to="/inventory" class="no-underline">
        <Button label="Zum Inventar" icon="pi pi-box" />
      </RouterLink>
      <RouterLink to="/shopping-list" class="no-underline">
        <Button
          label="Zur Einkaufsliste"
          icon="pi pi-shopping-cart"
          severity="secondary"
          outlined
        />
      </RouterLink>
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

/* ── Mini Map Preview ────────────────────────────────────── */
.mini-map-preview {
  position: relative;
  width: 100%;
  height: 180px;
  background: #e8f5e9;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #c8e6c9;
  margin-bottom: 0.75rem;
}

.mini-map-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(to right,  rgba(150, 180, 150, 0.28) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(150, 180, 150, 0.28) 1px, transparent 1px);
  background-size: 36px 36px;
  pointer-events: none;
}

.mini-map-grid::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(to right,  rgba(160, 200, 150, 0.5) 2px, transparent 2px),
    linear-gradient(to bottom, rgba(160, 200, 150, 0.5) 2px, transparent 2px);
  background-size: 108px 108px;
}

.mini-map-marker {
  position: absolute;
  transform: translate(-50%, -100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  z-index: 1;
}

.mini-map-marker i { font-size: 1.15rem; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3)); }
.mini-map-marker.user i         { color: #1565c0; font-size: 1.3rem; }
.mini-map-marker.store-open i   { color: #2e7d32; }
.mini-map-marker.store-closed i { color: #9e9e9e; }
.mini-map-marker.nearest i      { color: #e65100; font-size: 1.35rem; }

.mini-map-marker.nearest { z-index: 2; }

.mini-map-marker.nearest::before {
  content: '';
  position: absolute;
  top: -6px;
  left: 50%;
  transform: translateX(-50%);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid #e65100;
  opacity: 0.5;
  animation: mini-pulse 1.6s ease-out infinite;
}

@keyframes mini-pulse {
  0%   { transform: translateX(-50%) scale(0.8); opacity: 0.6; }
  100% { transform: translateX(-50%) scale(1.6); opacity: 0;   }
}

.mini-marker-label {
  font-size: 0.58rem;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 4px;
  padding: 1px 3px;
  white-space: nowrap;
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);
  color: #1b1b1b;
  max-width: 64px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mini-map-marker.user .mini-marker-label         { background: #1565c0; color: #fff; }
.mini-map-marker.nearest .mini-marker-label      { background: #e65100; color: #fff; }
.mini-map-marker.store-closed .mini-marker-label { background: rgba(158,158,158,0.85); color: #fff; }

/* ── Nearest Stores List ────────────────────────────────── */
.nearest-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.nearest-store-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.875rem;
  padding: 0.35rem 0.5rem;
  border-radius: 6px;
  transition: background 0.15s;
}

.nearest-store-item.nearest { background: #fff3e0; }

.nearest-store-info { display: flex; flex-direction: column; gap: 0.1rem; }
.nearest-store-name { font-weight: 500; color: #111827; line-height: 1.2; }
.nearest-store-item.nearest .nearest-store-name { color: #e65100; font-weight: 600; }
.nearest-store-meta { font-size: 0.75rem; color: #6b7280; }

/* ── Mobile ─────────────────────────────────────────────── */
@media (max-width: 650px) {
  .mini-map-marker i       { font-size: 0.95rem; }
  .mini-map-marker.user i  { font-size: 1.05rem; }
  .mini-marker-label { font-size: 0.5rem; max-width: 48px; }
}
</style>
