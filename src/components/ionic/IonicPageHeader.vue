<script setup lang="ts">
import { IonBackButton, IonButton, IonButtons, IonHeader, IonIcon, IonToolbar } from '@ionic/vue'
import { logOutOutline } from 'ionicons/icons'

withDefaults(defineProps<{
  title: string
  showBackButton?: boolean
  defaultBackHref?: string
}>(), {
  showBackButton: false,
  defaultBackHref: '/dashboard',
})

const emit = defineEmits<{
  logout: []
}>()
</script>

<template>
  <IonHeader class="freshflow-page-header ion-no-border">
    <IonToolbar class="freshflow-page-header__toolbar app-page-shell app-page-shell--header">
      <div class="freshflow-page-header__layout">
        <div class="freshflow-page-header__top-row">
          <IonButtons v-if="showBackButton" slot="start" class="freshflow-page-header__back-buttons">
            <IonBackButton :default-href="defaultBackHref" text="" class="freshflow-page-header__back-button" />
          </IonButtons>

          <div class="freshflow-page-header__brand">FreshFlow</div>

          <IonButtons class="freshflow-page-header__actions">
            <IonButton
              class="freshflow-page-header__logout"
              fill="clear"
              size="small"
              aria-label="Logout"
              @click="emit('logout')"
            >
              <template v-slot:start>
<IonIcon :icon="logOutOutline"  />
</template>
              Logout
            </IonButton>
          </IonButtons>
        </div>

        <h1 class="freshflow-page-header__title" :title="title">
          {{ title }}
        </h1>
      </div>
    </IonToolbar>
  </IonHeader>
</template>

<style>
.freshflow-page-header {
  display: block;
}

.freshflow-page-header__toolbar {
  --background: var(--ion-background-color, var(--sg-surface));
  --color: var(--ion-text-color, var(--sg-text));
  --border-width: 0 0 1px 0;
  --border-color: var(--sg-border, var(--ion-color-step-150, #e5e7eb));
  --padding-start: 0;
  --padding-end: 0;
  --min-height: auto;
  box-shadow: none;
}

.freshflow-page-header__layout {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  width: 100%;
  padding: 0;
}

.freshflow-page-header__top-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.4rem 0.5rem;
}

.freshflow-page-header__back-buttons {
  margin-inline: 0;
}

.freshflow-page-header__back-button {
  --padding-start: 0;
  --padding-end: 0;
  --color: var(--sg-muted, var(--ion-color-medium, #6b7280));
  min-height: 2rem;
}

.freshflow-page-header__back-button::part(text) {
  display: none;
}

.freshflow-page-header__brand {
  min-width: 0;
  color: var(--sg-primary, var(--ion-color-success, #2f855a));
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.01em;
  text-transform: none;
}

.freshflow-page-header__actions {
  margin-inline-start: auto;
  align-self: center;
}

.freshflow-page-header__title {
  min-width: 0;
  overflow: hidden;
  color: var(--ion-text-color, var(--sg-text));
  font-size: clamp(1.65rem, 4.8vw, 1.9rem);
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.02em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.freshflow-page-header__logout {
  --padding-start: 0.45rem;
  --padding-end: 0.45rem;
  --color: var(--sg-muted, var(--ion-color-medium, #6b7280));
  --ripple-color: transparent;
  min-height: 2rem;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0;
  text-transform: none;
}

.freshflow-page-header__logout::part(native) {
  text-transform: none;
}

.freshflow-page-header__logout ion-icon {
  font-size: 1rem;
}

@media (min-width: 768px) {
  .freshflow-page-header__top-row {
    gap: 0.4rem 0.75rem;
  }

  .freshflow-page-header__brand {
    font-size: 1rem;
  }

  .freshflow-page-header__title {
    font-size: 1.85rem;
  }
}
</style>