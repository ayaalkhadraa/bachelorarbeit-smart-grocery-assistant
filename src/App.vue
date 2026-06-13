<script setup lang="ts">
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { computed, onMounted, ref, watch } from 'vue'
import Button from 'primevue/button'
import OverlayPanel from 'primevue/overlaypanel'
import Tag from 'primevue/tag'
import { useGroceryStore } from '@/stores/groceryStore'

const route = useRoute()
const router = useRouter()
const groceryStore = useGroceryStore()

const currentUser = ref<{ email: string; name: string; loginMethod?: string } | null>(null)

function loadCurrentUser(): void {
  try {
    const raw = localStorage.getItem('smart-grocery-demo-user')
    currentUser.value = raw ? JSON.parse(raw) : null
  } catch {
    currentUser.value = null
  }
}

function logout(): void {
  localStorage.removeItem('smart-grocery-demo-user')
  currentUser.value = null
  router.push('/login')
}

onMounted(() => {
  groceryStore.loadItems()
})

watch(
  () => route.fullPath,
  () => {
    loadCurrentUser()
  },
  { immediate: true }
)

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

const isPublicRoute = computed(() => route.path === '/login')

// ── Notifications ──────────────────────────────────────────

interface AppNotification {
  id: string
  title: string
  text: string
  severity: 'danger' | 'warn' | 'info'
  icon: string
}

const notificationPanel = ref()

const notifications = computed<AppNotification[]>(() => {
  const result: AppNotification[] = []

  for (const item of groceryStore.criticalItems) {
    result.push({
      id: `critical-${item.id}`,
      title: 'Produkt abgelaufen',
      text: `${item.name} ist abgelaufen.`,
      severity: 'danger',
      icon: 'pi pi-exclamation-triangle',
    })
    if (result.length >= 5) return result
  }

  for (const item of groceryStore.soonExpiringItems) {
    result.push({
      id: `soon-${item.id}`,
      title: 'Läuft bald ab',
      text: `${item.name} läuft bald ab.`,
      severity: 'warn',
      icon: 'pi pi-clock',
    })
    if (result.length >= 5) return result
  }

  const openCount = groceryStore.openShoppingItems.length
  if (openCount > 0 && result.length < 5) {
    result.push({
      id: 'shopping-open',
      title: 'Einkaufsliste',
      text: `Du hast ${openCount} offene Artikel auf deiner Einkaufsliste.`,
      severity: 'info',
      icon: 'pi pi-shopping-cart',
    })
  }

  return result
})

const unreadNotificationCount = computed(() => notifications.value.length)

function toggleNotifications(event: Event): void {
  notificationPanel.value?.toggle(event)
}

function closeNotificationPanel(): void {
  notificationPanel.value?.hide()
}
</script>

<template>
  <!-- Public layout: no navigation -->
  <RouterView v-if="isPublicRoute" />

  <!-- App layout: full navigation -->
  <div v-else class="min-h-screen flex flex-col md:flex-row bg-[var(--sg-background)]">

    <!-- ── Sidebar (Desktop) ────────────────────────────────── -->
    <aside class="hidden md:flex flex-col w-60 shrink-0 sticky top-0 h-screen overflow-y-auto bg-[var(--sg-surface)] border-r border-[var(--sg-border)] [box-shadow:var(--sg-shadow-sm)]">
      <div class="flex flex-col gap-[0.2rem] px-5 py-6 border-b border-[var(--sg-border)]">
        <span class="text-[1.1rem] font-bold text-[var(--sg-primary)] tracking-[-0.01em]">FreshFlow</span>
        <span class="text-[0.7rem] text-[var(--sg-muted)] uppercase tracking-[0.08em]">Smart Grocery Assistant</span>
      </div>

      <nav class="p-3 flex flex-col gap-1">
        <RouterLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-3 px-[0.9rem] py-[0.65rem] rounded-[var(--sg-radius-md)] no-underline text-[var(--sg-text)] text-[0.9rem] transition-[background,color] duration-150 hover:bg-[var(--sg-primary-soft)] hover:text-[var(--sg-primary)]"
          :class="{ 'bg-[var(--sg-primary-soft)] text-[var(--sg-primary)] font-semibold': isActive(item.path) }"
        >
          <i :class="item.icon" class="text-base w-[1.1rem] text-center shrink-0"></i>
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>
    </aside>

    <!-- ── Main Area ────────────────────────────────────────── -->
    <div class="flex-1 flex flex-col min-w-0">

      <!-- Header -->
      <header class="h-14 md:h-16 bg-[var(--sg-surface)] border-b border-[var(--sg-border)] px-4 md:px-7 flex items-center justify-between gap-4 sticky top-0 z-10 [box-shadow:var(--sg-shadow-sm)]">
        <h2 class="text-[0.95rem] md:text-[1.05rem] font-semibold m-0 whitespace-nowrap text-color">{{ currentPageTitle }}</h2>

        <div class="flex items-center gap-2 flex-wrap">
          <div class="relative inline-flex items-center">
            <Button
              icon="pi pi-bell"
              text
              rounded
              aria-label="Benachrichtigungen"
              :badge="unreadNotificationCount > 0 ? String(unreadNotificationCount) : undefined"
              badgeSeverity="danger"
              @click="toggleNotifications"
            />
          </div>

          <OverlayPanel ref="notificationPanel" class="notification-panel">
            <div class="flex flex-col gap-[0.15rem] px-4 py-[0.85rem] pb-[0.6rem] border-b border-[var(--sg-border)]">
              <span class="text-[0.95rem] font-semibold text-color">Benachrichtigungen</span>
              <span class="text-[0.75rem] text-muted-color">Aktuelle Hinweise zu Vorrat und Einkaufsliste</span>
            </div>

            <div v-if="notifications.length === 0" class="flex flex-col items-center gap-2 py-6 px-4 text-muted-color text-[0.85rem]">
              <i class="pi pi-check-circle text-[1.5rem] text-[var(--p-green-500,#22c55e)]"></i>
              <span>Keine neuen Benachrichtigungen</span>
            </div>

            <ul v-else class="list-none m-0 p-0">
              <li v-for="n in notifications" :key="n.id" class="flex items-start gap-3 px-4 py-3 border-b border-[var(--sg-border)] last:border-b-0">
                <i :class="[n.icon, `notification-icon--${n.severity}`]" class="text-base mt-[0.15rem] shrink-0"></i>
                <div class="flex-1 min-w-0 flex flex-col gap-[0.15rem]">
                  <span class="text-[0.85rem] font-semibold text-color">{{ n.title }}</span>
                  <span class="text-[0.8rem] text-muted-color leading-[1.4]">{{ n.text }}</span>
                </div>
                <Tag
                  :value="n.severity === 'danger' ? 'Kritisch' : n.severity === 'warn' ? 'Bald' : 'Info'"
                  :severity="n.severity"
                  class="shrink-0 text-[0.7rem]"
                />
              </li>
            </ul>

            <div class="flex justify-end px-3 py-2 border-t border-[var(--sg-border)]">
              <Button
                label="Alle als gelesen markieren"
                icon="pi pi-check"
                text
                size="small"
                @click="closeNotificationPanel"
              />
            </div>
          </OverlayPanel>

          <template v-if="currentUser">
            <Button icon="pi pi-user" :label="currentUser.name" text disabled />
            <Button
              label="Logout"
              icon="pi pi-sign-out"
              severity="secondary"
              outlined
              size="small"
              @click="logout"
            />
          </template>

          <RouterLink v-else to="/login" class="no-underline">
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
      <main class="flex-1 p-4 pb-[calc(1rem+64px)] md:p-7 md:pb-7 overflow-y-auto">
        <RouterView />
      </main>
    </div>

    <!-- ── Bottom Navigation (Mobile) ──────────────────────── -->
    <nav class="flex md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[var(--sg-surface)] border-t border-[var(--sg-border)] z-[100] [box-shadow:0_-4px_14px_rgba(15,23,42,0.07)]">
      <RouterLink
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="flex-1 flex flex-col items-center justify-center gap-[3px] no-underline text-[var(--sg-muted)] text-[0.65rem] py-[0.4rem] px-[0.25rem] transition-[color,background] duration-150 min-h-[44px] active:bg-[var(--sg-primary-soft)]"
        :class="{ 'text-[var(--sg-primary)]': isActive(item.path) }"
      >
        <i :class="item.icon" class="text-[1.15rem]"></i>
        <span class="leading-none text-center">{{ item.label }}</span>
      </RouterLink>
    </nav>

  </div>
</template>

<style scoped>
/* ── Notification Panel: PrimeVue OverlayPanel override ───── */
:deep(.notification-panel) {
  width: 320px;
  max-width: calc(100vw - 2rem);
  padding: 0;
  border-radius: var(--sg-radius-md);
  overflow: hidden;
}

.notification-icon--danger { color: var(--p-red-500, #ef4444); }
.notification-icon--warn   { color: var(--p-orange-500, #f97316); }
.notification-icon--info   { color: var(--p-blue-500, #3b82f6); }
</style>