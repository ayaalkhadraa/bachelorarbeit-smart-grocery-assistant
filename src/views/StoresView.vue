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
  { id: 1, name: 'REWE City',    address: 'Alexanderplatz 1, Berlin',      distance: 0.8, open: true,  type: 'Supermarkt'     },
  { id: 2, name: 'EDEKA',        address: 'Friedrichstraße 120, Berlin',    distance: 1.4, open: true,  type: 'Supermarkt'     },
  { id: 3, name: 'Lidl',         address: 'Karl-Marx-Straße 90, Berlin',    distance: 2.1, open: false, type: 'Discounter'     },
  { id: 4, name: 'Bio Company',  address: 'Prenzlauer Allee 45, Berlin',    distance: 2.7, open: true,  type: 'Bio-Supermarkt' },
  { id: 5, name: 'Aldi Nord',    address: 'Hermannplatz 5, Berlin',         distance: 3.2, open: false, type: 'Discounter'     },
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
</style>
