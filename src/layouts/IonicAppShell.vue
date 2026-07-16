<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { Capacitor } from '@capacitor/core'
import {
  IonIcon,
  IonLabel,
  IonPage,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from '@ionic/vue'
import {
  cameraOutline,
  cubeOutline,
  ellipsisHorizontalCircleOutline,
  homeOutline,
  listOutline,
} from 'ionicons/icons'
import Button from 'primevue/button'

import { checkExpiringProducts } from '@/services/notificationService'
import { scheduleStartupExpiryReminderNotification } from '@/services/localNotificationService'
import { useGroceryStore } from '@/stores/groceryStore'
import { logout as performLogout } from '@/utils/logout'

const route = useRoute()
const router = useRouter()
const groceryStore = useGroceryStore()

const currentUser = ref<{ email: string; name: string; loginMethod?: string } | null>(null)
const canShowSidebarCollapse = ref(false)
const isDesktopSidebarCollapsed = ref(false)

let desktopCollapseMediaQueryList: MediaQueryList | null = null
let landscapeCollapseMediaQueryList: MediaQueryList | null = null

function syncSidebarCollapseState(): void {
  const matchesDesktop = desktopCollapseMediaQueryList?.matches ?? false
  const matchesLandscapeWide = landscapeCollapseMediaQueryList?.matches ?? false

  canShowSidebarCollapse.value = matchesDesktop || matchesLandscapeWide

  if (!canShowSidebarCollapse.value) {
    isDesktopSidebarCollapsed.value = false
  }
}

function toggleDesktopSidebar(): void {
  if (!canShowSidebarCollapse.value) {
    return
  }

  isDesktopSidebarCollapsed.value = !isDesktopSidebarCollapsed.value
}

function loadCurrentUser(): void {
  try {
    const raw = localStorage.getItem('smart-grocery-demo-user')
    currentUser.value = raw ? JSON.parse(raw) : null
  } catch {
    currentUser.value = null
  }
}

function logout(): void {
  performLogout(router)
  currentUser.value = null
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    desktopCollapseMediaQueryList = window.matchMedia('(min-width: 1024px)')
    landscapeCollapseMediaQueryList = window.matchMedia('(orientation: landscape) and (min-width: 768px)')

    desktopCollapseMediaQueryList.addEventListener('change', syncSidebarCollapseState)
    landscapeCollapseMediaQueryList.addEventListener('change', syncSidebarCollapseState)
  }

  syncSidebarCollapseState()
  window.addEventListener('resize', syncSidebarCollapseState)

  if (Capacitor.getPlatform() === 'android') {
    void scheduleStartupExpiryReminderNotification(groceryStore.items)
    return
  }

  if (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    Notification.permission === 'granted'
  ) {
    checkExpiringProducts(groceryStore.items)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', syncSidebarCollapseState)

  desktopCollapseMediaQueryList?.removeEventListener('change', syncSidebarCollapseState)
  landscapeCollapseMediaQueryList?.removeEventListener('change', syncSidebarCollapseState)
})

watch(
  () => route.fullPath,
  () => {
    loadCurrentUser()
  },
  { immediate: true }
)

const navItems = [
  { path: '/', label: 'Dashboard', icon: 'pi pi-home', routeName: 'dashboard' },
  { path: '/inventory', label: 'Inventar', icon: 'pi pi-box', routeName: 'inventory' },
  { path: '/shopping-list', label: 'Einkaufsliste', icon: 'pi pi-shopping-cart', routeName: 'shopping-list' },
  { path: '/scanner', label: 'Scanner', icon: 'pi pi-camera', routeName: 'scanner' },
  { path: '/stores', label: 'Supermärkte', icon: 'pi pi-map-marker', routeName: 'stores' },
  { path: '/settings', label: 'Einstellungen', icon: 'pi pi-cog', routeName: 'settings' },
]

const tabItems = [
  { path: '/', label: 'Dashboard', icon: homeOutline, tab: 'dashboard' },
  { path: '/inventory', label: 'Inventar', icon: cubeOutline, tab: 'inventory' },
  { path: '/shopping-list', label: 'Liste', icon: listOutline, tab: 'shopping-list' },
  { path: '/scanner', label: 'Scanner', icon: cameraOutline, tab: 'scanner' },
  { path: '/more', label: 'Mehr', icon: ellipsisHorizontalCircleOutline, tab: 'more' },
] as const

const routeName = computed(() => (typeof route.name === 'string' ? route.name : ''))

const selectedTab = computed(() => {
  switch (routeName.value) {
    case 'dashboard':
      return 'dashboard'
    case 'inventory':
      return 'inventory'
    case 'shopping-list':
      return 'shopping-list'
    case 'scanner':
      return 'scanner'
    case 'more':
    case 'stores':
    case 'settings':
      return 'more'
    default:
      return ''
  }
})

const isActive = (routeNameToMatch: string): boolean => routeName.value === routeNameToMatch
const isTabActive = (tab: string): boolean => selectedTab.value === tab

const pageTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  inventory: 'Inventar',
  'shopping-list': 'Liste',
  scanner: 'Scanner',
  more: 'Mehr',
  stores: 'Supermärkte',
  settings: 'Einstellungen',
}

const currentPageTitle = computed(() => pageTitles[routeName.value] ?? 'Smart Grocery')
</script>

<template>
  <IonPage>
    <div class="min-h-screen flex flex-col md:flex-row bg-[var(--sg-background)]">
      <aside
        class="hidden md:flex flex-col shrink-0 sticky top-0 h-screen overflow-y-auto bg-[var(--sg-surface)] border-r border-[var(--sg-border)] [box-shadow:var(--sg-shadow-sm)] transition-[width] duration-200 ease-out"
        :class="canShowSidebarCollapse && isDesktopSidebarCollapsed ? 'lg:w-20' : 'w-60 lg:w-60'"
      >
        <div class="flex items-center justify-between gap-3 px-5 py-6 border-b border-[var(--sg-border)]" :class="canShowSidebarCollapse && isDesktopSidebarCollapsed ? 'lg:px-3' : ''">
          <div class="min-w-0" :class="canShowSidebarCollapse && isDesktopSidebarCollapsed ? 'lg:hidden' : ''">
            <span class="text-[1.1rem] font-bold text-[var(--sg-primary)] tracking-[-0.01em]">FreshFlow</span>
            <span class="block text-[0.7rem] text-[var(--sg-muted)] uppercase tracking-[0.08em]">Smart Grocery Assistant</span>
          </div>

          <Button
            v-if="canShowSidebarCollapse"
            :icon="isDesktopSidebarCollapsed ? 'pi pi-angle-right' : 'pi pi-angle-left'"
            text
            rounded
            size="small"
            class="shrink-0"
            aria-label="Sidebar einklappen oder ausklappen"
            @click="toggleDesktopSidebar"
          />
        </div>

        <nav class="p-3 flex flex-col gap-1" :class="canShowSidebarCollapse && isDesktopSidebarCollapsed ? 'lg:px-2' : ''">
          <RouterLink
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="flex items-center rounded-[var(--sg-radius-md)] no-underline text-[var(--sg-text)] text-[0.9rem] transition-[background,color] duration-150 hover:bg-[var(--sg-primary-soft)] hover:text-[var(--sg-primary)]"
            :class="[
              { 'bg-[var(--sg-primary-soft)] text-[var(--sg-primary)] font-semibold': isActive(item.routeName) },
              canShowSidebarCollapse && isDesktopSidebarCollapsed ? 'lg:justify-center lg:px-3 lg:py-[0.8rem]' : 'gap-3 px-[0.9rem] py-[0.65rem]'
            ]"
          >
            <i :class="item.icon" class="text-base w-[1.1rem] text-center shrink-0"></i>
            <span v-if="!(canShowSidebarCollapse && isDesktopSidebarCollapsed)">{{ item.label }}</span>
          </RouterLink>
        </nav>
      </aside>

      <div class="flex-1 flex flex-col min-w-0">
        <header class="h-14 md:h-16 bg-[var(--sg-surface)] border-b border-[var(--sg-border)] px-4 md:px-7 flex items-center justify-between gap-4 sticky top-0 z-10 [box-shadow:var(--sg-shadow-sm)]">
          <h2 class="text-[0.95rem] md:text-[1.05rem] font-semibold m-0 whitespace-nowrap text-color">{{ currentPageTitle }}</h2>

          <div class="flex items-center gap-2 flex-wrap">
            <template v-if="currentUser">
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

        <IonTabs class="flex-1 flex flex-col min-w-0">
          <IonRouterOutlet />
          <IonTabBar
            slot="bottom"
            class="md:hidden bg-[var(--sg-surface)] border-t border-[var(--sg-border)] [box-shadow:0_-4px_14px_rgba(15,23,42,0.07)] pb-[env(safe-area-inset-bottom)]"
          >
            <IonTabButton
              v-for="item in tabItems"
              :key="item.tab"
              :tab="item.tab"
              :href="item.path"
              class="app-tab-button"
              :class="{ 'app-tab-button--active': isTabActive(item.tab) }"
            >
              <IonIcon :icon="item.icon" />
              <IonLabel>{{ item.label }}</IonLabel>
            </IonTabButton>
          </IonTabBar>
        </IonTabs>
      </div>
    </div>
  </IonPage>
</template>

<style scoped>
ion-tab-button.app-tab-button--active {
  color: var(--sg-primary);
}

ion-tab-button.app-tab-button--active::part(native) {
  background: var(--sg-primary-soft);
}
</style>
