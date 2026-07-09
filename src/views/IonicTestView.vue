<template>
  <div class="p-6">
    <h2 class="text-xl font-semibold mb-4">Ionic Test</h2>

    <ion-card>
      <ion-card-header>
        <ion-card-title>Ionic Card funktioniert</ion-card-title>
      </ion-card-header>

      <ion-card-content>
        Ionic wurde erfolgreich als zusätzliche UI-Schicht integriert,
        ohne die bestehende Navigation zu verändern.
      </ion-card-content>
    </ion-card>

    <ion-button>
      Ionic Button
    </ion-button>

    <ion-button router-link="/ionic-dashboard" fill="outline" class="mt-3">
      Zur Ionic Dashboard-Version
    </ion-button>
  </div>
</template>

<script setup lang="ts">
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton
} from '@ionic/vue'
</script>