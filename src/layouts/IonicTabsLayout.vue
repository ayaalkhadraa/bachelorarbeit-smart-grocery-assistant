<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonPopover,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from '@ionic/vue'
import {
  cameraOutline,
  chevronForwardOutline,
  cubeOutline,
  ellipsisHorizontalCircleOutline,
  homeOutline,
  listOutline,
  settingsOutline,
  storefrontOutline,
} from 'ionicons/icons'

type TabItem = {
  label: string
  icon: string
  tab: string
  href?: string
}

const tabItems: TabItem[] = [
  { label: 'Dashboard', icon: homeOutline, tab: 'dashboard', href: '/dashboard' },
  { label: 'Inventar', icon: cubeOutline, tab: 'inventory', href: '/inventory' },
  { label: 'Liste', icon: listOutline, tab: 'shopping-list', href: '/shopping-list' },
  { label: 'Scanner', icon: cameraOutline, tab: 'scanner', href: '/scanner' },
] as const

const moreMenuItems = [
  {
    label: 'Supermärkte',
    description: 'Standorte und Umgebung erkunden',
    icon: storefrontOutline,
    href: '/stores',
  },
  {
    label: 'Einstellungen',
    description: 'App- und Kontoeinstellungen',
    icon: settingsOutline,
    href: '/settings',
  },
] as const

const router = useRouter()
const route = useRoute()
const isMorePopoverOpen = ref(false)
const morePopoverEvent = ref<Event | null>(null)

const isMoreTabActive = computed(() => route.path === '/stores' || route.path === '/settings')

function openMorePopover(event: Event) {
  morePopoverEvent.value = event
  isMorePopoverOpen.value = true
}

function closeMorePopover() {
  isMorePopoverOpen.value = false
}

async function handleMoreMenuSelect(href: string) {
  closeMorePopover()
  await router.push(href)
}
</script>

<template>
  <IonPage>
    <IonTabs>
      <IonRouterOutlet />

      <IonTabBar slot="bottom" class="freshflow-tab-bar">
        <IonTabButton
          v-for="item in tabItems"
          :key="item.tab"
          :tab="item.tab"
          :href="item.href"
          class="freshflow-tab-button"
        >
          <IonIcon :icon="item.icon" />
          <IonLabel>{{ item.label }}</IonLabel>
        </IonTabButton>

        <button
          type="button"
          class="freshflow-more-tab"
          :class="{ 'freshflow-more-tab--active': isMoreTabActive }"
          aria-haspopup="menu"
          :aria-expanded="isMorePopoverOpen"
          @click="openMorePopover"
        >
          <IonIcon :icon="ellipsisHorizontalCircleOutline" class="freshflow-more-tab__icon" />
          <IonLabel class="freshflow-more-tab__label">Mehr</IonLabel>
        </button>
      </IonTabBar>

      <IonPopover
        :is-open="isMorePopoverOpen"
        :event="morePopoverEvent ?? undefined"
        side="top"
        alignment="center"
        class="more-popover"
        @didDismiss="closeMorePopover"
      >
        <IonList lines="full" class="m-0 bg-transparent py-2">
          <IonItem
            v-for="menuItem in moreMenuItems"
            :key="menuItem.href"
            button
            class="more-menu-item"
            @click="handleMoreMenuSelect(menuItem.href)"
          >
            <IonIcon slot="start" :icon="menuItem.icon" color="success" class="more-menu-icon" />
            <IonLabel class="ion-text-wrap">
              <h2 class="m-0 text-[0.96rem] font-semibold text-[var(--ion-text-color)]">
                {{ menuItem.label }}
              </h2>
              <p class="m-0 text-[0.8rem] text-[var(--ion-color-medium)]">
                {{ menuItem.description }}
              </p>
            </IonLabel>
            <IonIcon slot="end" :icon="chevronForwardOutline" color="medium" class="more-menu-chevron" />
          </IonItem>
        </IonList>
      </IonPopover>
    </IonTabs>
  </IonPage>
</template>

<style scoped>
.more-popover::part(content) {
  width: min(300px, calc(100vw - 24px));
  max-width: 300px;
  border-radius: 18px;
  overflow: hidden;
  background: var(--ion-background-color, #ffffff);
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.16);
}

.more-menu-item {
  --min-height: 58px;
}

.more-menu-icon,
.more-menu-chevron {
  font-size: 1.05rem;
}

:deep(ion-tab-bar.freshflow-tab-bar) {
  width: 100%;
  padding-inline: var(--app-page-gutter);
  box-sizing: border-box;
}

:deep(ion-tab-bar.freshflow-tab-bar ion-tab-button),
:deep(ion-tab-bar.freshflow-tab-bar .freshflow-more-tab) {
  flex: 1 1 0;
  min-width: 0;
}

@media (min-width: 48rem) {
  :deep(ion-tab-bar.freshflow-tab-bar) {
    padding-inline: max(
      var(--app-page-gutter),
      calc((100vw - var(--app-navigation-max-width)) / 2)
    );
  }

  :deep(ion-tab-bar.freshflow-tab-bar ion-tab-button),
  :deep(ion-tab-bar.freshflow-tab-bar .freshflow-more-tab) {
    max-width: calc(var(--app-navigation-max-width) / 5);
  }
}

.freshflow-more-tab {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 0;
  height: 100%;
  padding: 6px 0 5px;
  border: 0;
  background: transparent;
  color: var(--ion-color-medium, #6b7280);
  font: inherit;
  appearance: none;
}

.freshflow-more-tab--active {
  color: var(--ion-color-success, #2f855a);
}

.freshflow-more-tab__icon {
  font-size: 22px;
}

.freshflow-more-tab__label {
  margin-top: 2px;
  font-size: 12px;
  line-height: 1;
}
</style>