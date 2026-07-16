<script setup lang="ts">
import {
  IonCard,
  IonCardContent,
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonPage,
  IonText,
} from '@ionic/vue'
import { settingsOutline, storefrontOutline } from 'ionicons/icons'
</script>

<template>
  <IonPage>
    <IonContent :fullscreen="true">
      <main class="w-full">
      <section class="mb-6">
      <div class="mb-4">
        <IonText color="dark">
          <h1 class="m-0 text-2xl font-semibold">Mehr</h1>
        </IonText>
        <p class="mt-2 mb-0 text-sm text-muted-color">
          Weitere Bereiche der App.
        </p>
      </div>

      <IonCard class="m-0">
        <IonCardContent class="p-0">
          <IonList lines="full" class="bg-transparent">
            <IonItem router-link="/stores" detail>
              <IonIcon slot="start" :icon="storefrontOutline" />
              <IonLabel>
                <h2 class="font-semibold text-color">Supermärkte</h2>
                <p class="text-sm text-muted-color">Standorte und Umgebung erkunden</p>
              </IonLabel>
              <IonNote slot="end">Öffnen</IonNote>
            </IonItem>

            <IonItem router-link="/settings" detail>
              <IonIcon slot="start" :icon="settingsOutline" />
              <IonLabel>
                <h2 class="font-semibold text-color">Einstellungen</h2>
                <p class="text-sm text-muted-color">App- und Kontoeinstellungen</p>
              </IonLabel>
              <IonNote slot="end">Öffnen</IonNote>
            </IonItem>
          </IonList>
        </IonCardContent>
      </IonCard>
    </section>
      </main>
    </IonContent>
  </IonPage>
</template>
