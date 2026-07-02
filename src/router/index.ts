import { createRouter, createWebHistory } from 'vue-router'

import DashboardView from '@/views/DashboardView.vue'
import InventoryView from '@/views/InventoryView.vue'
import ShoppingListView from '@/views/ShoppingListView.vue'
import ScannerView from '@/views/ScannerView.vue'
import StoresView from '@/views/StoresView.vue'
import SettingsView from '@/views/SettingsView.vue'
import LoginView from '@/views/LoginView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView
    },
    {
      path: '/inventory',
      name: 'inventory',
      component: InventoryView
    },
    {
      path: '/shopping-list',
      name: 'shopping-list',
      component: ShoppingListView
    },
    {
      path: '/scanner',
      name: 'scanner',
      component: ScannerView
    },
    {
      path: '/stores',
      name: 'stores',
      component: StoresView
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    }
  ]
})

function hasDemoUser(): boolean {
  try {
    return localStorage.getItem('smart-grocery-demo-user') !== null
  } catch {
    return false
  }
}

router.beforeEach((to) => {
  const isPublicRoute = to.path === '/login'

  if (!isPublicRoute && !hasDemoUser()) {
    return '/login'
  }

  return true
})

export default router