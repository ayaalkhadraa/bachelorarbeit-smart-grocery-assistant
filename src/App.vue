<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { computed, onMounted } from 'vue'
import Button from 'primevue/button'
import Badge from 'primevue/badge'
import { useGroceryStore } from '@/stores/groceryStore'

const route = useRoute()
const groceryStore = useGroceryStore()

onMounted(() => {
  groceryStore.loadItems()
})

const navItems = [
  { path: '/',              label: 'Dashboard',    icon: 'pi pi-home' },
  { path: '/inventory',     label: 'Inventar',     icon: 'pi pi-box' },
  { path: '/shopping-list', label: 'Einkaufsliste',icon: 'pi pi-shopping-cart' },
  { path: '/scanner',       label: 'Scanner',      icon: 'pi pi-camera' },
  { path: '/stores',        label: 'Supermärkte',  icon: 'pi pi-map-marker' },
  { path: '/settings',      label: 'Einstellungen',icon: 'pi pi-cog' },
]

const isActive = (path: string): boolean => route.path === path

const pageTitles: Record<string, string> = {
  '/':              'Dashboard',
  '/inventory':     'Inventar',
  '/shopping-list': 'Einkaufsliste',
  '/scanner':       'Scanner',
  '/stores':        'Supermärkte',
  '/settings':      'Einstellungen',
  '/login':         'Login',
}

const currentPageTitle = computed(() => pageTitles[route.path] ?? 'Smart Grocery')
</script>

<template>
  <div class="app-layout">

    <!-- ── Sidebar (Desktop) ────────────────────────────────── -->
    <aside class="sidebar">
      <div class="sidebar-brand">
        <span class="brand-title">FreshFlow</span>
        <span class="brand-sub">Smart Grocery Assistant</span>
      </div>

      <nav class="sidebar-nav">
        <RouterLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: isActive(item.path) }"
        >
          <i :class="item.icon" class="nav-icon"></i>
          <span class="nav-label">{{ item.label }}</span>
        </RouterLink>
      </nav>
    </aside>

    <!-- ── Main Area ────────────────────────────────────────── -->
    <div class="main-area">

      <!-- Header -->
      <header class="top-header">
        <h2 class="page-title">{{ currentPageTitle }}</h2>

        <div class="header-actions">
          <div class="bell-wrapper">
            <Button icon="pi pi-bell" text rounded aria-label="Benachrichtigungen" />
            <Badge value="1" severity="danger" class="notification-badge" />
          </div>

          <Button icon="pi pi-user" label="Demo User" text />

          <RouterLink to="/login" class="login-link">
            <Button
              label="Login"
              icon="pi pi-sign-in"
              severity="secondary"
              outlined
              size="small"
            />
          </RouterLink>
        </div>
      </header>

      <!-- Content -->
      <main class="page-content">
        <RouterView />
      </main>
    </div>

    <!-- ── Bottom Navigation (Mobile) ──────────────────────── -->
    <nav class="bottom-nav">
      <RouterLink
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="bottom-nav-item"
        :class="{ active: isActive(item.path) }"
      >
        <i :class="item.icon" class="bottom-nav-icon"></i>
        <span class="bottom-nav-label">{{ item.label }}</span>
      </RouterLink>
    </nav>

  </div>
</template>

<style scoped>
/* ── Base Layout ──────────────────────────────────────────── */
.app-layout {
  min-height: 100vh;
  display: flex;
  background: var(--sg-background);
}

/* ── Sidebar ──────────────────────────────────────────────── */
.sidebar {
  width: 240px;
  flex-shrink: 0;
  background: var(--sg-surface);
  border-right: 1px solid var(--sg-border);
  box-shadow: var(--sg-shadow-sm);
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}

.sidebar-brand {
  padding: 1.5rem 1.25rem 1.25rem;
  border-bottom: 1px solid var(--sg-border);
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.brand-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--sg-primary);
  letter-spacing: -0.01em;
}

.brand-sub {
  font-size: 0.7rem;
  color: var(--sg-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.sidebar-nav {
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.9rem;
  border-radius: var(--sg-radius-md);
  text-decoration: none;
  color: var(--sg-text);
  font-size: 0.9rem;
  transition: background 0.15s, color 0.15s;
}

.nav-item:hover {
  background: var(--sg-primary-soft);
  color: var(--sg-primary);
}

.nav-item.active {
  background: var(--sg-primary-soft);
  color: var(--sg-primary);
  font-weight: 600;
}

.nav-icon {
  font-size: 1rem;
  width: 1.1rem;
  text-align: center;
  flex-shrink: 0;
}

/* ── Main Area ────────────────────────────────────────────── */
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* ── Header ───────────────────────────────────────────────── */
.top-header {
  height: 64px;
  background: var(--sg-surface);
  border-bottom: 1px solid var(--sg-border);
  box-shadow: var(--sg-shadow-sm);
  padding: 0 1.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  position: sticky;
  top: 0;
  z-index: 10;
}

.page-title {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--sg-text);
  margin: 0;
  white-space: nowrap;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.bell-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.notification-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  pointer-events: none;
}

.login-link {
  text-decoration: none;
}

/* ── Page Content ─────────────────────────────────────────── */
.page-content {
  flex: 1;
  padding: 1.75rem;
  overflow-y: auto;
}

/* ── Bottom Navigation (hidden on desktop) ────────────────── */
.bottom-nav {
  display: none;
}

/* ── Mobile ───────────────────────────────────────────────── */
@media (max-width: 767px) {
  .app-layout {
    flex-direction: column;
  }

  /* Hide sidebar entirely on mobile */
  .sidebar {
    display: none;
  }

  /* Compact header */
  .top-header {
    height: 56px;
    padding: 0 1rem;
  }

  .page-title {
    font-size: 0.95rem;
  }

  /* Extra space for bottom nav */
  .page-content {
    padding: 1rem;
    padding-bottom: calc(1rem + 64px);
  }

  /* Show bottom navigation */
  .bottom-nav {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 64px;
    background: var(--sg-surface);
    border-top: 1px solid var(--sg-border);
    box-shadow: 0 -4px 14px rgba(15, 23, 42, 0.07);
    z-index: 100;
  }

  .bottom-nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    text-decoration: none;
    color: var(--sg-muted);
    font-size: 0.65rem;
    padding: 0.4rem 0.25rem;
    transition: color 0.15s, background 0.15s;
    min-height: 44px; /* touch-friendly */
    border-radius: 0;
  }

  .bottom-nav-item:active {
    background: var(--sg-primary-soft);
  }

  .bottom-nav-item.active {
    color: var(--sg-primary);
  }

  .bottom-nav-icon {
    font-size: 1.15rem;
  }

  .bottom-nav-label {
    line-height: 1;
    text-align: center;
  }
}
</style>