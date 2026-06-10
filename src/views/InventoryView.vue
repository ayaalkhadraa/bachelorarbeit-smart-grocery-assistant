<script setup>
import { computed, ref } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Tag from 'primevue/tag'

import { useGroceryStore } from '@/stores/groceryStore'

const groceryStore = useGroceryStore()

const searchTerm = ref('')

const filteredItems = computed(() => {
  return groceryStore.items.filter((item) => {
    return (
      item.name.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.value.toLowerCase())
    )
  })
})

const getStatusLabel = (status) => {
  if (status === 'fresh') return 'Frisch'
  if (status === 'soon') return 'Läuft bald ab'
  if (status === 'critical') return 'Kritisch'
  return 'Unbekannt'
}

const getStatusSeverity = (status) => {
  if (status === 'fresh') return 'success'
  if (status === 'soon') return 'warning'
  if (status === 'critical') return 'danger'
  return 'secondary'
}
</script>

<template>
  <main class="inventory-page">
    <section class="page-header">
      <div>
        <h1>Inventar</h1>
        <p>Alle gespeicherten Lebensmittel im Überblick.</p>
      </div>

      <Button label="Neues Produkt" icon="pi pi-plus" />
    </section>

    <section class="search-section">
      <IconField class="search-box">
       <InputIcon class="pi pi-search" />
       <InputText v-model="searchTerm" placeholder="Nach Name oder Kategorie suchen..." />
       </IconField>
    </section>

    <section class="items-grid">
      <Card v-for="item in filteredItems" :key="item.id" class="item-card">
        <template #title>
          <div class="card-title">
            <span>{{ item.name }}</span>

            <Button
              text
              rounded
              :icon="item.favorite ? 'pi pi-star-fill' : 'pi pi-star'"
              @click="groceryStore.toggleFavorite(item.id)"
            />
          </div>
        </template>

        <template #subtitle>
          {{ item.category }}
        </template>

        <template #content>
          <div class="item-content">
            <Tag
              :value="getStatusLabel(item.status)"
              :severity="getStatusSeverity(item.status)"
            />

            <p>
              <strong>Menge:</strong>
              {{ item.quantity }} {{ item.unit }}
            </p>

            <p>
              <strong>Ablaufdatum:</strong>
              {{ item.expiryDate }}
            </p>

            <p>
              <strong>Ort:</strong>
              {{ item.location }}
            </p>
          </div>
        </template>

        <template #footer>
          <div class="card-actions">
            <Button
              label="-"
              severity="secondary"
              outlined
              @click="groceryStore.updateQuantity(item.id, Math.max(0, item.quantity - 1))"
            />

            <Button
              label="+"
              severity="secondary"
              outlined
              @click="groceryStore.updateQuantity(item.id, item.quantity + 1)"
            />

            <Button
              icon="pi pi-trash"
              severity="danger"
              outlined
              @click="groceryStore.deleteItem(item.id)"
            />
          </div>
        </template>
      </Card>
    </section>

    <p v-if="filteredItems.length === 0" class="empty-message">
      Keine Lebensmittel gefunden.
    </p>
  </main>
</template>

<style scoped>
.inventory-page {
  width: 100%;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.page-header h1 {
  margin: 0;
  font-size: 2rem;
  color: #111827;
}

.page-header p {
  margin: 0.4rem 0 0;
  color: #6b7280;
}

.search-section {
  margin-bottom: 1.5rem;
}

.search-box {
  width: 100%;
   max-width: 500px;
}

.search-box input {
  width: 100%;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.item-card {
  height: 100%;
}

.card-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.item-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.item-content p {
  margin: 0;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.empty-message {
  margin-top: 2rem;
  text-align: center;
  color: #6b7280;
}

@media (max-width: 1000px) {
  .items-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 650px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .items-grid {
    grid-template-columns: 1fr;
  }
}
</style>