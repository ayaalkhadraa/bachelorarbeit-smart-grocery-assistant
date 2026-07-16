<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { IonApp, IonRouterOutlet } from '@ionic/vue'
import { Capacitor } from '@capacitor/core'

import { checkExpiringProducts } from '@/services/notificationService'
import { scheduleStartupExpiryReminderNotification } from '@/services/localNotificationService'
import { useGroceryStore } from '@/stores/groceryStore'

const groceryStore = useGroceryStore()

let desktopResizeListener: (() => void) | null = null

onMounted(() => {
  groceryStore.loadItems()

  if (Capacitor.getPlatform() === 'android') {
    void scheduleStartupExpiryReminderNotification(groceryStore.items)
    return
  }

  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    checkExpiringProducts(groceryStore.items)
  }

  desktopResizeListener = () => undefined
})

onUnmounted(() => {
  desktopResizeListener = null
})
</script>

<template>
  <IonApp>
    <IonRouterOutlet />
  </IonApp>
</template>