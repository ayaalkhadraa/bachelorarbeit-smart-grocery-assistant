<script setup lang="ts">
import { ref, computed } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Message from 'primevue/message'
import InputText from 'primevue/inputtext'

const searchTerm = ref('')
const locationEnabled = ref(false)

const stores = [
  { id: 1, name: 'REWE City',    address: 'Alexanderplatz 1, Berlin',      distance: 0.8, open: true,  type: 'Supermarkt',     mapX: 62, mapY: 38 },
  { id: 2, name: 'EDEKA',        address: 'Friedrichstraße 120, Berlin',    distance: 1.4, open: true,  type: 'Supermarkt',     mapX: 42, mapY: 52 },
  { id: 3, name: 'Lidl',         address: 'Karl-Marx-Straße 90, Berlin',    distance: 2.1, open: false, type: 'Discounter',     mapX: 72, mapY: 68 },
  { id: 4, name: 'Bio Company',  address: 'Prenzlauer Allee 45, Berlin',    distance: 2.7, open: true,  type: 'Bio-Supermarkt', mapX: 30, mapY: 34 },
  { id: 5, name: 'Aldi Nord',    address: 'Hermannplatz 5, Berlin',         distance: 3.2, open: false, type: 'Discounter',     mapX: 55, mapY: 74 },
]

const filteredStores = computed(() => {
  const term = searchTerm.value.toLowerCase()
  if (!term) return stores
  return stores.filter(
    (s) =>
      s.name.toLowerCase().includes(term) ||
      s.address.toLowerCase().includes(term) ||
      s.type.toLowerCase().includes(term)
  )
})

const userPosition = { x: 50, y: 50 }

const nearestStore = computed(() => {
  if (filteredStores.value.length === 0) return null
  return filteredStores.value.reduce((prev, curr) =>
    curr.distance < prev.distance ? curr : prev
  )
})

function enableLocationSimulation() {
  locationEnabled.value = true
}

function resetLocationSimulation() {
  locationEnabled.value = false
}
</script>

<template>
  <main class="stores-page">
    <div class="stores-header">
      <h1>Supermärkte</h1>
      <p>Übersicht über nahegelegene Einkaufsmöglichkeiten im Web-Prototyp.</p>
    </div>

    <Message severity="info" :closable="false">
      Die Standortbestimmung wird in dieser Web-Version simuliert. In der mobilen Variante kann sie später über Capacitor Geolocation umgesetzt werden.
    </Message>

    <!-- Location Card -->
    <Card class="location-card">
      <template #title>Standortsimulation</template>
      <template #content>
        <div class="location-content">
          <template v-if="!locationEnabled">
            <p>Standort wurde noch nicht aktiviert.</p>
            <Button
              label="Standort verwenden"
              icon="pi pi-map-marker"
              @click="enableLocationSimulation"
            />
          </template>
          <template v-else>
            <p>Simulierter Standort aktiv: Berlin</p>
            <Tag value="Standort aktiv" severity="success" />
            <Button
              label="Zurücksetzen"
              icon="pi pi-refresh"
              severity="secondary"
              outlined
              @click="resetLocationSimulation"
            />
          </template>
        </div>
      </template>
    </Card>

    <!-- Search -->
    <div class="search-section">
      <InputText
        v-model="searchTerm"
        placeholder="Nach Supermarkt, Adresse oder Typ suchen..."
        class="w-full"
      />
    </div>

    <!-- Map Preview Card -->
    <Card class="map-card">
      <template #title>Map Preview</template>
      <template #subtitle>Simulierte Kartenansicht der nahegelegenen Supermärkte.</template>
      <template #content>
        <div class="map-preview">
          <div class="map-grid" />

          <!-- User Marker -->
          <div
            class="map-marker user"
            :style="{ left: userPosition.x + '%', top: userPosition.y + '%' }"
          >
            <i class="pi pi-map-marker" />
            <span class="marker-label">Du</span>
          </div>

          <!-- Store Markers -->
          <div
            v-for="store in filteredStores"
            :key="store.id"
            class="map-marker store"
            :class="{ nearest: store.id === nearestStore?.id }"
            :style="{ left: store.mapX + '%', top: store.mapY + '%' }"
          >
            <i class="pi pi-shopping-cart" />
            <span class="marker-label">{{ store.name }}</span>
          </div>

          <!-- Empty state inside map -->
          <div v-if="filteredStores.length === 0" class="map-empty-hint">
            Keine Marker für die aktuelle Suche.
          </div>

          <!-- Legend -->
          <div class="map-legend">
            <span><i class="pi pi-map-marker" /> Du bist hier</span>
            <span><i class="pi pi-circle-fill" /> Nächster Markt</span>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="map-summary">
          <Tag v-if="locationEnabled" value="Standortsimulation aktiv" severity="success" />
          <span v-if="nearestStore">
            Nächster Markt: <strong>{{ nearestStore.name }}</strong> ({{ nearestStore.distance }} km)
          </span>
          <span v-if="!locationEnabled" class="map-hint">
            Aktiviere die Standortsimulation, um die Nähe visuell zu bewerten.
          </span>
        </div>
      </template>
    </Card>

    <!-- Stores Grid -->
    <div v-if="filteredStores.length > 0" class="stores-grid">
      <Card v-for="store in filteredStores" :key="store.id" class="store-card">
        <template #title>{{ store.name }}</template>
        <template #subtitle>{{ store.type }}</template>
        <template #content>
          <div class="store-content">
            <div class="store-meta">
              <p><i class="pi pi-map-marker"></i> {{ store.address }}</p>
              <p><i class="pi pi-compass"></i> {{ store.distance }} km</p>
            </div>
            <Tag
              :value="store.open ? 'Geöffnet' : 'Geschlossen'"
              :severity="store.open ? 'success' : 'danger'"
            />
          </div>
        </template>
        <template #footer>
          <div class="store-actions">
            <Button label="Details" icon="pi pi-info-circle" severity="secondary" outlined />
            <Button label="Route simulieren" icon="pi pi-directions" />
          </div>
        </template>
      </Card>
    </div>

    <div v-else class="empty-state">
      <p>Keine Supermärkte gefunden.</p>
    </div>
  </main>
</template>

<style scoped>
.stores-page {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.stores-header h1 {
  margin: 0 0 0.25rem 0;
  font-size: 1.75rem;
}

.stores-header p {
  margin: 0;
  color: var(--p-text-muted-color, #6c757d);
}

.location-card {
  max-width: 480px;
}

.location-content {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

.location-content p {
  margin: 0;
  flex: 1 1 100%;
}

.search-section {
  display: flex;
}

.search-section .p-inputtext {
  width: 100%;
}

.stores-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
}

.store-card {
  display: flex;
  flex-direction: column;
}

.store-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.store-meta p {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.9rem;
  color: var(--p-text-muted-color, #6c757d);
}

.store-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--p-text-muted-color, #6c757d);
}

@media (max-width: 1000px) {
  .stores-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 650px) {
  .stores-grid {
    grid-template-columns: 1fr;
  }
}

/* ── Map Card ─────────────────────────────────────────── */
.map-card {
  width: 100%;
}

.map-preview {
  position: relative;
  width: 100%;
  height: 260px;
  background: #e8f5e9;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #c8e6c9;
}

/* Decorative road grid via pseudo-element on .map-grid */
.map-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(to right, rgba(150, 180, 150, 0.3) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(150, 180, 150, 0.3) 1px, transparent 1px);
  background-size: 40px 40px;
  pointer-events: none;
}

/* Road-like lines */
.map-grid::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(to right, rgba(180, 200, 160, 0.55) 2px, transparent 2px),
    linear-gradient(to bottom, rgba(180, 200, 160, 0.55) 2px, transparent 2px);
  background-size: 120px 120px;
}

/* ── Markers ──────────────────────────────────────────── */
.map-marker {
  position: absolute;
  transform: translate(-50%, -100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  cursor: default;
  transition: transform 0.2s ease;
  z-index: 1;
}

.map-marker i {
  font-size: 1.4rem;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.35));
  transition: font-size 0.2s ease;
}

.map-marker.user i {
  color: #1565c0;
  font-size: 1.6rem;
}

.map-marker.store i {
  color: #2e7d32;
}

.map-marker.nearest i {
  color: #e65100;
  font-size: 1.7rem;
}

.map-marker.nearest {
  z-index: 2;
}

/* Pulse ring on nearest marker */
.map-marker.nearest::before {
  content: '';
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid #e65100;
  opacity: 0.5;
  animation: pulse-ring 1.6s ease-out infinite;
}

@keyframes pulse-ring {
  0%   { transform: translateX(-50%) scale(0.8); opacity: 0.6; }
  100% { transform: translateX(-50%) scale(1.6); opacity: 0; }
}

/* ── Marker Labels ────────────────────────────────────── */
.marker-label {
  font-size: 0.65rem;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 4px;
  padding: 1px 4px;
  white-space: nowrap;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  color: #1b1b1b;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.map-marker.user .marker-label {
  background: #1565c0;
  color: #fff;
}

.map-marker.nearest .marker-label {
  background: #e65100;
  color: #fff;
}

/* ── Empty hint inside map ────────────────────────────── */
.map-empty-hint {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  color: #6c757d;
  pointer-events: none;
}

/* ── Legend ───────────────────────────────────────────── */
.map-legend {
  position: absolute;
  bottom: 8px;
  left: 8px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  background: rgba(255, 255, 255, 0.88);
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 0.7rem;
  color: #333;
  pointer-events: none;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
}

.map-legend span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.map-legend .pi-map-marker { color: #1565c0; }
.map-legend .pi-circle-fill { color: #e65100; }

/* ── Summary footer ───────────────────────────────────── */
.map-summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9rem;
}

.map-summary strong {
  color: var(--p-text-color, #1b1b1b);
}

.map-hint {
  color: var(--p-text-muted-color, #6c757d);
  font-size: 0.85rem;
}

/* ── Mobile ───────────────────────────────────────────── */
@media (max-width: 650px) {
  .map-preview {
    height: 220px;
  }

  .map-marker i {
    font-size: 1.1rem;
  }

  .map-marker.user i {
    font-size: 1.25rem;
  }

  .map-marker.nearest i {
    font-size: 1.3rem;
  }

  .marker-label {
    font-size: 0.55rem;
    max-width: 56px;
  }
}
</style>
