import { createRouter, createWebHistory } from '@ionic/vue-router'

import IonicTabsLayout from '@/layouts/IonicTabsLayout.vue'
import IonicLoginView from '@/views/IonicLoginView.vue'
import IonicTestView from '@/views/IonicTestView.vue'
import IonicDashboardView from '@/views/IonicDashboardView.vue'
import IonicInventoryView from '@/views/IonicInventoryView.vue'
import IonicShoppingListView from '@/views/IonicShoppingListView.vue'
import IonicScannerView from '@/views/IonicScannerView.vue'
import IonicStoresView from '@/views/IonicStoresView.vue'
import IonicSettingsView from '@/views/IonicSettingsView.vue'
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/tabs',
      component: IonicTabsLayout,
      children: [
        {
          path: '',
          redirect: '/dashboard'
        },
        {
          path: 'dashboard',
          name: 'dashboard',
          alias: '/dashboard',
          component: IonicDashboardView
        },
        {
          path: 'inventory',
          name: 'inventory',
          alias: '/inventory',
          component: IonicInventoryView
        },
        {
          path: 'shopping-list',
          name: 'shopping-list',
          alias: '/shopping-list',
          component: IonicShoppingListView
        },
        {
          path: 'scanner',
          name: 'scanner',
          alias: '/scanner',
          component: IonicScannerView
        },
        {
          path: 'stores',
          name: 'stores',
          alias: '/stores',
          component: IonicStoresView
        },
        {
          path: 'settings',
          name: 'settings',
          alias: '/settings',
          component: IonicSettingsView
        },
        {
          path: 'more',
          alias: '/more',
          redirect: '/dashboard'
        },
      ]
    },
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/login',
      name: 'login',
      component: IonicLoginView
    },
    {
      path: '/ionic-login',
      name: 'ionic-login',
      component: IonicLoginView
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
  const isPublicRoute = to.path === '/login' || to.path === '/ionic-login'

  if (!isPublicRoute && !hasDemoUser()) {
    return '/login'
  }

  return true
})

export default router