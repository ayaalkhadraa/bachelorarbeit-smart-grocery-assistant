<script setup>
import { RouterLink, RouterView, useRoute } from 'vue-router'
import Button from 'primevue/button'
import Badge from 'primevue/badge'
import { onMounted } from 'vue'
import { useGroceryStore } from '@/stores/groceryStore'
const route = useRoute()
const groceryStore = useGroceryStore()
onMounted(() => {
  groceryStore.loadItems()
})
const navItems = [
  {
    path: '/',
    label: 'Dashboard',
    icon: 'pi pi-home'
  },
  {
    path: '/inventory',
    label: 'Inventar',
    icon: 'pi pi-box'
  },
  {
    path: '/shopping-list',
    label: 'Einkaufsliste',
    icon: 'pi pi-shopping-cart'
  },
  {
    path: '/scanner',
    label: 'Scanner',
    icon: 'pi pi-camera'
  },
  {
    path: '/stores',
    label: 'Supermärkte',
    icon: 'pi pi-map-marker'
  },
  {
    path: '/settings',
    label: 'Einstellungen',
    icon: 'pi pi-cog'
  }
]

const isActive = (path) => {
  return route.path === path
}
</script>

<template>
  <div class="app-layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h1>Smart Grocery Assistant</h1>
      </div>

      <nav class="sidebar-nav">
        <RouterLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: isActive(item.path) }"
        >
          <i :class="item.icon"></i>
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>
    </aside>

    <div class="main-area">
      <header class="top-header">
        <div></div>

        <div class="header-actions">
          <Button icon="pi pi-bell" text rounded aria-label="Benachrichtigungen">
            <Badge value="1" severity="danger" class="notification-badge" />
          </Button>

          <Button icon="pi pi-user" label="Demo User" text />
        </div>
      </header>

      <main class="page-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  background: #f8fafc;
}

.sidebar {
  width: 260px;
  background: #ffffff;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.sidebar-header h1 {
  font-size: 1.1rem;
  margin: 0;
  color: #111827;
}

.sidebar-nav {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.9rem 1rem;
  border-radius: 0.8rem;
  text-decoration: none;
  color: #374151;
  transition: 0.2s;
}

.nav-item:hover {
  background: #f3f4f6;
}

.nav-item.active {
  background: #e0f2fe;
  color: #0284c7;
  font-weight: 600;
}

.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.top-header {
  height: 70px;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  padding: 0 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  position: relative;
}

.notification-badge {
  position: absolute;
  top: 0;
  right: 6.5rem;
}

.page-content {
  padding: 2rem;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .app-layout {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #e5e7eb;
  }

  .sidebar-header {
    padding: 1rem;
  }

  .sidebar-nav {
    flex-direction: row;
    overflow-x: auto;
    padding: 0.8rem;
  }

  .nav-item {
    white-space: nowrap;
    padding: 0.7rem 0.9rem;
  }

  .top-header {
    padding: 0 1rem;
  }

  .page-content {
    padding: 1rem;
  }
}
</style>