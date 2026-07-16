<script setup lang="ts">
import { IonIcon, IonLabel, IonPage, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs } from '@ionic/vue'
import { cameraOutline, cubeOutline, ellipsisHorizontalCircleOutline, homeOutline, listOutline } from 'ionicons/icons'

const tabItems = [
  { label: 'Dashboard', icon: homeOutline, tab: 'dashboard', href: '/dashboard' },
  { label: 'Inventar', icon: cubeOutline, tab: 'inventory', href: '/inventory' },
  { label: 'Liste', icon: listOutline, tab: 'shopping-list', href: '/shopping-list' },
  { label: 'Scanner', icon: cameraOutline, tab: 'scanner', href: '/scanner' },
  { label: 'Mehr', icon: ellipsisHorizontalCircleOutline, tab: 'more', href: '/more' },
] as const
</script>

<template>
  <IonPage>
    <IonTabs>
      <IonRouterOutlet />

      <IonTabBar slot="bottom">
        <IonTabButton
          v-for="item in tabItems"
          :key="item.tab"
          :tab="item.tab"
          :href="item.href"
        >
          <IonIcon :icon="item.icon" />
          <IonLabel>{{ item.label }}</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  </IonPage>
</template>