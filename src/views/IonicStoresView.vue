<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { Capacitor } from '@capacitor/core'
import { Geolocation } from '@capacitor/geolocation'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonChip,
  IonCol,
  IonGrid,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonRow,
  IonSearchbar,
  IonText,
  IonToggle,
} from '@ionic/vue'
import { compassOutline, locateOutline, mapOutline, navigateOutline, searchOutline, storefrontOutline } from 'ionicons/icons'

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

type LocationPosition = {
  coords: {
    latitude: number
    longitude: number
    accuracy: number
  }
}

type Store = {
  id: number
  name: string
  address: string
  open: boolean
  type: string
  lat: number
  lng: number
}

type StoreWithDistance = Store & {
  distance: number | null
}

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

const stores: Store[] = [
  { id: 1, name: 'REWE City', address: 'Alexanderplatz 1, Berlin', open: true, type: 'Supermarkt', lat: 52.5219, lng: 13.4132 },
  { id: 2, name: 'EDEKA', address: 'Friedrichstraße 120, Berlin', open: true, type: 'Supermarkt', lat: 52.5195, lng: 13.3887 },
  { id: 3, name: 'Lidl', address: 'Karl-Marx-Straße 90, Berlin', open: false, type: 'Discounter', lat: 52.4807, lng: 13.4355 },
  { id: 4, name: 'Aldi Nord', address: 'Schönhauser Allee 79, Berlin', open: true, type: 'Discounter', lat: 52.536, lng: 13.412 },
  { id: 5, name: 'Kaufland', address: 'Tempelhof Damm 14, Berlin', open: true, type: 'Supermarkt', lat: 52.467, lng: 13.382 },
]

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

const storesWithDistance = computed<StoreWithDistance[]>(() =>
  stores.map((store) => ({
    ...store,
    distance: userCoords.value
      ? getDistanceKm(userCoords.value.lat, userCoords.value.lng, store.lat, store.lng)
      : null,
  }))
)

const filteredStores = computed<StoreWithDistance[]>(() => {
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

const nearestStore = computed<StoreWithDistance | null>(() => {
  const withDist = filteredStores.value.filter((s) => s.distance !== null)
  return withDist[0] ?? null
})

function setBrowserLocationError(error: GeolocationPositionError) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      locationError.value = 'Standort-Zugriff wurde abgelehnt. Bitte erlaube den Standort-Zugriff in den Browser-Einstellungen.'
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
      locationError.value = 'Standort-Zugriff wurde abgelehnt. Bitte erlaube den Standort-Zugriff in den Android-App-Berechtigungen.'
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
      locationError.value = 'Standortbestimmung erfordert HTTPS oder localhost. Bitte öffne die App über https:// oder localhost.'
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

async function handleLocationToggle(enabled: boolean) {
  if (enabled) {
    await requestLocation()
    return
  }

  resetLocation()
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

  const userIcon = L.divIcon({
    className: '',
    html: '<div class="lf-user-marker"><i class="pi pi-map-marker"></i></div>',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  })

  L.marker([lat, lng], { icon: userIcon })
    .addTo(leafletMap)
    .bindPopup('Du bist hier')

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

function openRoute(store: { lat: number; lng: number; name: string }) {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}&destination_place_id=${encodeURIComponent(store.name)}`
  window.open(url, '_blank', 'noopener,noreferrer')
}

function getStatusText(store: StoreWithDistance): string {
  if (store.distance === null) {
    return 'Entfernung nach Standortfreigabe'
  }

  return `${store.distance.toFixed(2)} km`
}

function getStatusColor(store: Store): 'success' | 'danger' | 'medium' {
  return store.open ? 'success' : 'danger'
}

onBeforeUnmount(() => {
  if (leafletMap) {
    leafletMap.remove()
    leafletMap = null
  }
})
</script>

<template>
  <main class="w-full pb-[calc(7rem+env(safe-area-inset-bottom))] md:pb-7">
    <section class="mb-4 flex flex-col gap-3">
      <div class="flex flex-col gap-1">
        <h1 class="m-0 text-3xl font-bold text-color">Ionic-Stores</h1>
        <p class="m-0 text-sm text-muted-color">Mobile Vergleichsansicht für Standorte, Karte und Navigation.</p>
      </div>

      <IonCard class="m-0 store-status-card">
        <IonCardHeader class="px-4 pt-4 pb-3">
          <IonCardTitle class="text-lg">Standort</IonCardTitle>
          <IonCardSubtitle>Aktiviere deinen aktuellen Standort für Entfernung und Karte.</IonCardSubtitle>
        </IonCardHeader>
        <IonCardContent class="px-4 pt-0 pb-4">
          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between gap-3">
              <div>
                <div class="font-semibold text-color">Standort freigeben</div>
                <IonText color="medium">
                  <p class="m-0 text-sm">Für die Distanzberechnung und die Leaflet-Karte.</p>
                </IonText>
              </div>
              <IonToggle
                :modelValue="locationEnabled"
                :disabled="locationLoading"
                @update:modelValue="handleLocationToggle"
              />
            </div>

            <IonGrid class="m-0 p-0">
              <IonRow>
                <IonCol size="12" size-md="4" class="p-0">
                  <IonChip color="success" class="m-0 status-chip">
                    <IonIcon :icon="locationEnabled ? locateOutline : searchOutline" />
                    <IonLabel>{{ locationEnabled ? 'Standort aktiv' : 'Standort inaktiv' }}</IonLabel>
                  </IonChip>
                </IonCol>
                <IonCol size="12" size-md="4" class="p-0">
                  <IonChip v-if="locationEnabled && userCoords" color="primary" class="m-0 status-chip">
                    <IonIcon :icon="compassOutline" />
                    <IonLabel>{{ userCoords.accuracy.toFixed(0) }} m Genauigkeit</IonLabel>
                  </IonChip>
                  <IonChip v-else color="medium" class="m-0 status-chip">
                    <IonIcon :icon="storefrontOutline" />
                    <IonLabel>Keine Standortdaten</IonLabel>
                  </IonChip>
                </IonCol>
                <IonCol size="12" size-md="4" class="p-0">
                  <IonButton expand="block" color="success" class="m-0 ion-activate-button" :disabled="locationLoading" @click="requestLocation">
                    <IonIcon :icon="locateOutline" slot="start" />
                    Standort laden
                  </IonButton>
                </IonCol>
              </IonRow>
            </IonGrid>

            <IonNote v-if="locationError" color="danger" class="ion-text-wrap">{{ locationError }}</IonNote>
          </div>
        </IonCardContent>
      </IonCard>

      <IonSearchbar
        v-model="searchTerm"
        placeholder="Standorte suchen"
        inputmode="search"
        show-clear-button="focus"
      />
    </section>

    <section class="mb-4">
      <IonCard class="m-0 map-card">
        <IonCardHeader class="px-4 pt-4 pb-3">
          <IonCardTitle class="text-lg">Karte</IonCardTitle>
          <IonCardSubtitle>
            <span v-if="locationEnabled">Echter Standort mit OpenStreetMap</span>
            <span v-else>Standort freigeben, damit die Karte geladen wird.</span>
          </IonCardSubtitle>
        </IonCardHeader>
        <IonCardContent class="px-4 pt-0 pb-4">
          <div v-if="locationEnabled" ref="mapContainer" class="leaflet-map-container" />
          <div v-else class="map-placeholder">
            <IonIcon :icon="mapOutline" class="text-4xl text-muted-color" />
            <IonText color="medium">
              <p class="m-0 text-sm text-center">Die Karte erscheint nach Standortfreigabe.</p>
            </IonText>
          </div>
          <div v-if="nearestStore" class="mt-3 flex flex-wrap items-center gap-2">
            <IonChip color="warning" class="m-0">
              <IonLabel>Nächster Markt</IonLabel>
            </IonChip>
            <IonText class="text-sm">
              <strong>{{ nearestStore.name }}</strong>
              <span> · {{ nearestStore.distance!.toFixed(2) }} km</span>
            </IonText>
          </div>
        </IonCardContent>
      </IonCard>
    </section>

    <section class="mb-4">
      <IonList lines="none" class="stores-list bg-transparent p-0">
        <IonCard
          v-for="store in filteredStores"
          :key="store.id"
          class="m-0 store-card"
          :class="{ 'nearest-card': store.id === nearestStore?.id }"
        >
          <IonCardHeader class="px-4 pt-4 pb-2">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 flex-1">
                <IonCardTitle class="text-lg leading-tight">{{ store.name }}</IonCardTitle>
                <IonCardSubtitle class="mt-1">{{ store.type }}</IonCardSubtitle>
              </div>
              <IonChip v-if="store.id === nearestStore?.id" color="warning" class="m-0">
                <IonLabel>Nächster</IonLabel>
              </IonChip>
            </div>
          </IonCardHeader>
          <IonCardContent class="px-4 pt-0 pb-4">
            <IonGrid class="m-0 p-0">
              <IonRow>
                <IonCol size="12" class="p-0">
                  <IonItem lines="none" class="store-meta-item" :detail="false">
                    <IonIcon :icon="storefrontOutline" slot="start" />
                    <IonLabel class="ion-text-wrap">
                      <h3 class="font-medium text-color">{{ store.address }}</h3>
                      <p class="m-0 text-sm text-muted-color">{{ getStatusText(store) }}</p>
                    </IonLabel>
                  </IonItem>
                </IonCol>
                <IonCol size="12" size-sm="6" class="p-0">
                  <IonBadge :color="getStatusColor(store)" class="store-open-badge">{{ store.open ? 'Geöffnet' : 'Geschlossen' }}</IonBadge>
                </IonCol>
                <IonCol size="12" size-sm="6" class="p-0">
                  <IonText color="medium" class="text-sm">
                    {{ store.distance !== null ? `${store.distance.toFixed(2)} km entfernt` : 'Distanz nach Standortfreigabe' }}
                  </IonText>
                </IonCol>
              </IonRow>
            </IonGrid>

            <div class="mt-4 flex flex-col gap-2 sm:flex-row">
              <IonButton expand="block" fill="outline" color="success" class="m-0 flex-1" @click="openRoute(store)">
                <IonIcon :icon="navigateOutline" slot="start" />
                Navigation öffnen
              </IonButton>
              <IonButton expand="block" color="success" class="m-0 flex-1" @click="openRoute(store)">
                <IonIcon :icon="navigateOutline" slot="start" />
                Route anzeigen
              </IonButton>
            </div>
          </IonCardContent>
        </IonCard>
      </IonList>

      <div v-if="filteredStores.length === 0" class="py-8 text-center">
        <IonText color="medium">Keine Supermärkte gefunden.</IonText>
      </div>
    </section>
  </main>
</template>

<style scoped>
.store-status-card,
.map-card,
.store-card {
  border-radius: 18px;
}

.status-chip {
  width: 100%;
  justify-content: flex-start;
}

.ion-activate-button {
  min-height: 48px;
  --border-radius: 14px;
}

.leaflet-map-container {
  width: 100%;
  height: 340px;
  border-radius: 16px;
  overflow: hidden;
  z-index: 0;
}

.map-placeholder {
  width: 100%;
  min-height: 240px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  background: linear-gradient(180deg, rgba(22, 163, 74, 0.08), rgba(22, 163, 74, 0.03));
  border: 1px dashed rgba(22, 163, 74, 0.25);
  border-radius: 16px;
}

.stores-list {
  display: grid;
  gap: 0.875rem;
}

.store-card {
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.08);
}

.nearest-card {
  outline: 1px solid rgba(22, 163, 74, 0.28);
}

.store-meta-item {
  --padding-start: 0;
  --inner-padding-end: 0;
}

.store-open-badge {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  border-radius: 999px;
}

:deep(.searchbar-input) {
  --border-radius: 16px;
}

:deep(.searchbar-input-container) {
  border-radius: 16px;
}

:deep(.ion-color-success) {
  --ion-color-base: #16a34a;
  --ion-color-base-rgb: 22, 163, 74;
}
</style>