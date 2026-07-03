<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { Capacitor } from '@capacitor/core'
import { Geolocation } from '@capacitor/geolocation'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Message from 'primevue/message'
import InputText from 'primevue/inputtext'

// Fix default Leaflet marker icon paths broken by bundlers
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const searchTerm = ref('')
const locationEnabled = ref(false)
const locationLoading = ref(false)
const locationError = ref('')
const mapContainer = ref<HTMLElement | null>(null)
let leafletMap: L.Map | null = null

const userCoords = ref<{
  lat: number
  lng: number
  accuracy: number
} | null>(null)

type LocationPosition = {
  coords: {
    latitude: number
    longitude: number
    accuracy: number
  }
}

// ── Haversine formula ──────────────────────────────────────
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ── Stores ────────────────────────────────────────────────
const stores = [
  { id: 1, name: 'REWE City',  address: 'Alexanderplatz 1, Berlin',       open: true,  type: 'Supermarkt', lat: 52.5219, lng: 13.4132 },
  { id: 2, name: 'EDEKA',      address: 'Friedrichstraße 120, Berlin',     open: true,  type: 'Supermarkt', lat: 52.5195, lng: 13.3887 },
  { id: 3, name: 'Lidl',       address: 'Karl-Marx-Straße 90, Berlin',     open: false, type: 'Discounter', lat: 52.4807, lng: 13.4355 },
  { id: 4, name: 'Aldi Nord',  address: 'Schönhauser Allee 79, Berlin',    open: true,  type: 'Discounter', lat: 52.5360, lng: 13.4120 },
  { id: 5, name: 'Kaufland',   address: 'Tempelhof Damm 14, Berlin',       open: true,  type: 'Supermarkt', lat: 52.4670, lng: 13.3820 },
]

const storesWithDistance = computed(() =>
  stores.map((store) => ({
    ...store,
    distance: userCoords.value
      ? getDistanceKm(userCoords.value.lat, userCoords.value.lng, store.lat, store.lng)
      : null,
  }))
)

const filteredStores = computed(() => {
  const term = searchTerm.value.toLowerCase()
  return storesWithDistance.value
    .filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.address.toLowerCase().includes(term) ||
        s.type.toLowerCase().includes(term)
    )
    .sort((a, b) => {
      if (a.distance === null) return 1
      if (b.distance === null) return -1
      return a.distance - b.distance
    })
})

const nearestStore = computed(() => {
  const withDist = filteredStores.value.filter((s) => s.distance !== null)
  return withDist.length > 0 ? withDist[0] : null
})

// ── Geolocation ───────────────────────────────────────────
async function applyPosition(position: LocationPosition) {
  userCoords.value = {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    accuracy: position.coords.accuracy,
  }
  locationEnabled.value = true
  await nextTick()
  initMap()
}

function setBrowserLocationError(error: GeolocationPositionError) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      locationError.value =
        'Standort-Zugriff wurde abgelehnt. Bitte erlaube den Standort-Zugriff in den Browser-Einstellungen.'
      break
    case error.POSITION_UNAVAILABLE:
      locationError.value = 'Standort konnte nicht ermittelt werden.'
      break
    case error.TIMEOUT:
      locationError.value = 'Standort-Anfrage hat zu lange gedauert.'
      break
    default:
      locationError.value = 'Unbekannter Fehler bei der Standortbestimmung.'
  }
}

function setNativeLocationError(error: unknown) {
  const code = typeof error === 'object' && error !== null && 'code' in error ? (error as { code?: string }).code : undefined

  switch (code) {
    case 'OS-PLUG-GLOC-0003':
      locationError.value =
        'Standort-Zugriff wurde abgelehnt. Bitte erlaube den Standort-Zugriff in den Android-App-Berechtigungen.'
      break
    case 'OS-PLUG-GLOC-0007':
      locationError.value = 'Standortdienste sind auf dem Gerät deaktiviert.'
      break
    case 'OS-PLUG-GLOC-0009':
      locationError.value = 'Standortfreigabe wurde vom Gerät abgelehnt.'
      break
    case 'OS-PLUG-GLOC-0010':
      locationError.value = 'Standort-Anfrage hat zu lange gedauert.'
      break
    default:
      locationError.value = 'Unbekannter Fehler bei der Standortbestimmung.'
  }
}

async function requestLocation() {
  locationError.value = ''
  locationLoading.value = true

  try {
    if (Capacitor.isNativePlatform()) {
      await Geolocation.requestPermissions()
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      })
      await applyPosition(position)
      return
    }

    if (!('geolocation' in navigator)) {
      locationError.value = 'Dein Browser unterstützt keine Standortbestimmung.'
      return
    }

    const isSecure = location.protocol === 'https:' || location.hostname === 'localhost'
    if (!isSecure) {
      locationError.value =
        'Standortbestimmung erfordert HTTPS oder localhost. Bitte öffne die App über https:// oder localhost.'
      return
    }

    const position = await new Promise<LocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      })
    })
    await applyPosition(position)
  } catch (error) {
    locationEnabled.value = false

    if (Capacitor.isNativePlatform()) {
      setNativeLocationError(error)
    } else if (typeof error === 'object' && error !== null && 'code' in error) {
      setBrowserLocationError(error as GeolocationPositionError)
    } else {
      locationError.value = 'Unbekannter Fehler bei der Standortbestimmung.'
    }
  } finally {
    locationLoading.value = false
  }
}

function resetLocation() {
  locationEnabled.value = false
  userCoords.value = null
  locationError.value = ''
  if (leafletMap) {
    leafletMap.remove()
    leafletMap = null
  }
}

// ── Leaflet map init ──────────────────────────────────────
function initMap() {
  if (!mapContainer.value || !userCoords.value) return

  const { lat, lng } = userCoords.value

  if (leafletMap) {
    leafletMap.remove()
    leafletMap = null
  }

  leafletMap = L.map(mapContainer.value).setView([lat, lng], 14)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(leafletMap)

  // User marker (blue)
  const userIcon = L.divIcon({
    className: '',
    html: '<div class="lf-user-marker"><i class="pi pi-map-marker"></i></div>',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  })
  L.marker([lat, lng], { icon: userIcon })
    .addTo(leafletMap)
    .bindPopup('Du bist hier')

  // Store markers
  stores.forEach((store) => {
    const isNearest = nearestStore.value?.id === store.id
    const storeIcon = L.divIcon({
      className: '',
      html: `<div class="lf-store-marker${isNearest ? ' nearest' : ''}"><i class="pi pi-shopping-cart"></i></div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
    })
    L.marker([store.lat, store.lng], { icon: storeIcon })
      .addTo(leafletMap!)
      .bindPopup(`<strong>${store.name}</strong><br>${store.address}`)
  })
}

// ── Navigation ────────────────────────────────────────────
function openRoute(store: { lat: number; lng: number; name: string }) {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}&destination_place_id=${encodeURIComponent(store.name)}`
  window.open(url, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <main class="stores-page">
    <!-- Header -->
    <div class="stores-header">
      <h1>Supermärkte</h1>
      <p>Übersicht über nahegelegene Einkaufsmöglichkeiten.</p>
    </div>

    <!-- Location Card -->
    <Card class="location-card">
      <template #title>Standort</template>
      <template #content>
        <div class="location-content">
          <template v-if="!locationEnabled">
            <p>Standort wurde noch nicht aktiviert.</p>
            <Button
              label="Standort freigeben"
              icon="pi pi-map-marker"
              :loading="locationLoading"
              @click="requestLocation"
            />
          </template>

          <template v-else>
            <p>Genauigkeit: {{ userCoords?.accuracy?.toFixed(0) }} m</p>
            <Tag value="Standort aktiv" severity="success" />
            <Button
              label="Zurücksetzen"
              icon="pi pi-refresh"
              severity="secondary"
              outlined
              @click="resetLocation"
            />
          </template>

          <Message v-if="locationError" severity="error" :closable="false" class="location-error">
            {{ locationError }}
          </Message>
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

    <!-- Leaflet Map Card -->
    <Card class="map-card">
      <template #title>Karte</template>
      <template #subtitle>
        <span v-if="locationEnabled">Echter Standort – OpenStreetMap</span>
        <span v-else>Bitte Standort freigeben, um die Karte zu laden.</span>
      </template>
      <template #content>
        <div v-if="locationEnabled" ref="mapContainer" class="leaflet-map-container" />
        <div v-else class="map-placeholder">
          <i class="pi pi-map" style="font-size: 2.5rem; color: var(--p-text-muted-color, #6c757d);" />
          <p>Karte erscheint nach Standortfreigabe.</p>
        </div>
      </template>
      <template #footer>
        <div v-if="nearestStore" class="map-summary">
          <Tag value="Nächster Markt" severity="warn" />
          <span>
            <strong>{{ nearestStore.name }}</strong>
            ({{ nearestStore.distance!.toFixed(2) }} km)
          </span>
        </div>
      </template>
    </Card>

    <!-- Stores Grid -->
    <div v-if="filteredStores.length > 0" class="stores-grid">
      <Card
        v-for="store in filteredStores"
        :key="store.id"
        class="store-card"
        :class="{ 'nearest-card': store.id === nearestStore?.id }"
      >
        <template #title>
          <div class="store-title-row">
            <span>{{ store.name }}</span>
            <Tag
              v-if="store.id === nearestStore?.id"
              value="Nächster"
              severity="warn"
              class="nearest-tag"
            />
          </div>
        </template>
        <template #subtitle>{{ store.type }}</template>
        <template #content>
          <div class="store-content">
            <div class="store-meta">
              <p><i class="pi pi-map-marker" /> {{ store.address }}</p>
              <p>
                <i class="pi pi-compass" />
                <span v-if="store.distance !== null">
                  {{ store.distance.toFixed(2) }} km
                </span>
                <span v-else>Entfernung nach Standortfreigabe</span>
              </p>
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
            <Button
              label="Route anzeigen"
              icon="pi pi-directions"
              @click="openRoute(store)"
            />
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

.location-error {
  flex: 1 1 100%;
}

.search-section {
  display: flex;
}

.search-section .p-inputtext {
  width: 100%;
}

/* ── Leaflet Map ──────────────────────────────────────────── */
.map-card {
  width: 100%;
}

.leaflet-map-container {
  width: 100%;
  height: 380px;
  border-radius: 8px;
  overflow: hidden;
  z-index: 0;
}

.map-placeholder {
  width: 100%;
  height: 260px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  background: var(--p-surface-100, #f8f9fa);
  border-radius: 8px;
  color: var(--p-text-muted-color, #6c757d);
}

.map-placeholder p {
  margin: 0;
  font-size: 0.9rem;
}

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

/* ── Stores Grid ──────────────────────────────────────────── */
.stores-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
}

.store-card {
  display: flex;
  flex-direction: column;
}

.nearest-card {
  outline: 2px solid var(--p-orange-400, #fb923c);
  border-radius: var(--p-card-border-radius, 8px);
}

.store-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.nearest-tag {
  font-size: 0.7rem;
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

  .leaflet-map-container {
    height: 280px;
  }
}
</style>
