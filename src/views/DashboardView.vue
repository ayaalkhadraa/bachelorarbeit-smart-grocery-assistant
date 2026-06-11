<script setup lang="ts">
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import { RouterLink } from 'vue-router'
import { useGroceryStore } from '@/stores/groceryStore'

const groceryStore = useGroceryStore()

const nearestStores = [
  { id: 1, name: 'REWE City', distance: 0.8, open: true,  mapX: 62, mapY: 38 },
  { id: 2, name: 'EDEKA',     distance: 1.4, open: true,  mapX: 42, mapY: 52 },
  { id: 3, name: 'Lidl',      distance: 2.1, open: false, mapX: 72, mapY: 68 },
]

const userPosition = { x: 50, y: 50 }

const expiringItems = [
  ...groceryStore.criticalItems,
  ...groceryStore.soonExpiringItems
]
</script>

<template>
  <main class="dashboard-page">
    <section class="dashboard-header">
      <h1>Dashboard</h1>
    </section>

    <section class="stats-grid">
      <Card class="stat-card">
        <template #content>
          <div class="stat-number">{{ groceryStore.totalItems }}</div>
          <div class="stat-label">Lebensmittel im Inventar</div>
        </template>
      </Card>

      <Card class="stat-card">
        <template #content>
          <div class="stat-number">{{ groceryStore.freshItems.length }}</div>
          <div class="stat-label">
            <Tag value="Frisch" severity="success" />
          </div>
        </template>
      </Card>

      <Card class="stat-card">
        <template #content>
          <div class="stat-number">{{ groceryStore.soonExpiringItems.length }}</div>
          <div class="stat-label">
            <Tag value="Bald ablaufend" severity="warning" />
          </div>
        </template>
      </Card>

      <Card class="stat-card">
        <template #content>
          <div class="stat-number">{{ groceryStore.criticalItems.length }}</div>
          <div class="stat-label">
            <Tag value="Abgelaufen" severity="danger" />
          </div>
        </template>
      </Card>
    </section>

    <section class="content-grid">
      <Card>
        <template #title>Favoriten</template>
        <template #content>
          <template v-if="groceryStore.favoriteItems.length > 0">
            <ul class="list">
              <li
                v-for="item in groceryStore.favoriteItems"
                :key="item.id"
                class="list-item"
              >
                <span class="list-item-info">
                  <strong>{{ item.name }}</strong>
                  <span class="list-item-meta">{{ item.category }} · {{ item.quantity }} {{ item.unit }}</span>
                </span>
                <Tag value="Favorit" severity="info" />
              </li>
            </ul>
          </template>
          <p v-else class="empty-text">Noch keine Favoriten vorhanden.</p>
        </template>
      </Card>

      <Card>
        <template #title>Bald ablaufende Produkte</template>
        <template #content>
          <template v-if="expiringItems.length > 0">
            <ul class="list">
              <li
                v-for="item in expiringItems"
                :key="item.id"
                class="list-item"
              >
                <span class="list-item-info">
                  <strong>{{ item.name }}</strong>
                  <span class="list-item-meta">{{ item.expiryDate }}</span>
                </span>
                <Tag
                  v-if="item.status === 'critical'"
                  value="Abgelaufen"
                  severity="danger"
                />
                <Tag v-else value="Bald" severity="warning" />
              </li>
            </ul>
          </template>
          <p v-else class="empty-text">Keine bald ablaufenden Produkte.</p>
        </template>
      </Card>
    </section>

    <!-- Map Preview Card -->
    <section class="map-section">
      <Card class="nearby-store-card">
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
          <div class="dashboard-map-actions">
            <RouterLink to="/stores">
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

    <section class="dashboard-actions">
      <RouterLink to="/inventory">
        <Button label="Zum Inventar" icon="pi pi-box" />
      </RouterLink>
      <RouterLink to="/shopping-list">
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
.dashboard-page {
  width: 100%;
}

.dashboard-header {
  margin-bottom: 1.5rem;
}

.dashboard-header h1 {
  margin: 0;
  font-size: 2rem;
  color: #111827;
}

.dashboard-header p {
  margin: 0.4rem 0 0;
  color: #6b7280;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  text-align: center;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 700;
  color: #111827;
  line-height: 1;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.list-item-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.list-item-meta {
  font-size: 0.8rem;
  color: #6b7280;
}

.empty-text {
  margin: 0;
  color: #6b7280;
}

.dashboard-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.dashboard-actions a {
  text-decoration: none;
}

@media (max-width: 1000px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 650px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

/* ── Map Section ─────────────────────────────────────── */
.map-section {
  margin-bottom: 1.5rem;
}

.nearby-store-card {
  width: 100%;
}

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

/* Grid / road lines */
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

/* ── Mini Markers ─────────────────────────────────────── */
.mini-map-marker {
  position: absolute;
  transform: translate(-50%, -100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  z-index: 1;
}

.mini-map-marker i {
  font-size: 1.15rem;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
}

.mini-map-marker.user i         { color: #1565c0; font-size: 1.3rem; }
.mini-map-marker.store-open i   { color: #2e7d32; }
.mini-map-marker.store-closed i { color: #9e9e9e; }
.mini-map-marker.nearest i      { color: #e65100; font-size: 1.35rem; }

.mini-map-marker.nearest {
  z-index: 2;
}

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

/* ── Mini Labels ──────────────────────────────────────── */
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

/* ── Nearest List ─────────────────────────────────────── */
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
  background: transparent;
  transition: background 0.15s;
}

.nearest-store-item.nearest {
  background: #fff3e0;
}

.nearest-store-info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.nearest-store-name {
  font-weight: 500;
  color: #111827;
  line-height: 1.2;
}

.nearest-store-item.nearest .nearest-store-name {
  color: #e65100;
  font-weight: 600;
}

.nearest-store-meta {
  font-size: 0.75rem;
  color: #6b7280;
}

/* ── Actions ──────────────────────────────────────────── */
.dashboard-map-actions {
  display: flex;
}

.dashboard-map-actions a {
  text-decoration: none;
}

/* ── Mobile ───────────────────────────────────────────── */
@media (max-width: 650px) {
  .mini-map-preview {
    height: 180px;
  }

  .mini-map-marker i       { font-size: 0.95rem; }
  .mini-map-marker.user i  { font-size: 1.05rem; }

  .mini-marker-label {
    font-size: 0.5rem;
    max-width: 48px;
  }
}
</style>