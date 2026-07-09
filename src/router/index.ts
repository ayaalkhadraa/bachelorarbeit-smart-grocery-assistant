import { createRouter, createWebHistory } from 'vue-router'

import DashboardView from '@/views/DashboardView.vue'
import IonicDashboardView from '@/views/IonicDashboardView.vue'
import IonicInventoryView from '@/views/IonicInventoryView.vue'
import InventoryView from '@/views/InventoryView.vue'
import ShoppingListView from '@/views/ShoppingListView.vue'
import ScannerView from '@/views/ScannerView.vue'
import IonicScannerView from '@/views/IonicScannerView.vue'
import StoresView from '@/views/StoresView.vue'
import SettingsView from '@/views/SettingsView.vue'
import LoginView from '@/views/LoginView.vue'
import IonicTestView from '@/views/IonicTestView.vue'
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      alias: '/dashboard',
      component: DashboardView
    },
    {
      path: '/ionic-dashboard',
      name: 'ionic-dashboard',
      component: IonicDashboardView
    },
    {
      path: '/inventory',
      name: 'inventory',
      component: InventoryView
    },
    {
      path: '/ionic-inventory',
      name: 'ionic-inventory',
      component: IonicInventoryView
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
      path: '/ionic-scanner',
      name: 'ionic-scanner',
      component: IonicScannerView
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
    },
    {
      path: '/ionic-test',
      name: 'ionic-test',
      component: IonicTestView
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