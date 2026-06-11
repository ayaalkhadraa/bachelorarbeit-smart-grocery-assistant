<script setup lang="ts">
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import { RouterLink } from 'vue-router'
import { useGroceryStore } from '@/stores/groceryStore'

const groceryStore = useGroceryStore()

const expiringItems = [
  ...groceryStore.criticalItems,
  ...groceryStore.soonExpiringItems
]
</script>

<template>
  <main class="dashboard-page">
    <section class="dashboard-header">
      <h1>Dashboard</h1>
      <p>Überblick über dein Inventar, bald ablaufende Produkte und Favoriten.</p>
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
</style>