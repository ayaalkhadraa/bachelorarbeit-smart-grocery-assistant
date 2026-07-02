<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import ToggleSwitch from 'primevue/toggleswitch'
import Message from 'primevue/message'
import Divider from 'primevue/divider'
import { useGroceryStore } from '@/stores/groceryStore'
import NotificationCard from '@/components/NotificationCard.vue'

const groceryStore = useGroceryStore()
onMounted(() => {
  groceryStore.loadItems()
  console.log('[SettingsView] loaded grocery items:', groceryStore.items)
})

const username = ref('Demo User')
const language = ref('Deutsch')
const notificationsEnabled = ref(true)
const darkModeSimulation = ref(false)
const resetMessageVisible = ref(false)

const languages = ['Deutsch', 'Englisch', 'Arabisch']

const SETTINGS_KEY = 'smart-grocery-settings'

function saveSettings(): void {
  const settings = {
    username: username.value,
    language: language.value,
    notificationsEnabled: notificationsEnabled.value,
    darkModeSimulation: darkModeSimulation.value,
  }
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  resetMessageVisible.value = false
}

function resetPrototypeData(): void {
  localStorage.removeItem('smart-grocery-items')
  localStorage.removeItem(SETTINGS_KEY)
  groceryStore.loadItems()
  resetMessageVisible.value = true
}
</script>

<template>
  <main class="max-w-[1000px] mx-auto">
    <div class="mb-6">
      <h1 class="text-[1.75rem] font-bold m-0 mb-1">Einstellungen</h1>
      <p class="text-muted-color m-0">Verwaltung einfacher Prototyp-Einstellungen.</p>
    </div>

    <Message severity="info" :closable="false">
      Diese Einstellungen dienen der Simulation im Web-Prototyp und ersetzen kein vollständiges Benutzerkonto.
    </Message>

    <Divider />

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      <!-- Card: Profil -->
      <Card>
        <template #title>Profil</template>
        <template #content>
          <div class="flex flex-col gap-[0.4rem] mb-4">
            <label for="username" class="text-sm font-medium">Benutzername</label>
            <InputText id="username" v-model="username" placeholder="Benutzername eingeben" />
          </div>
          <div class="flex flex-col gap-[0.4rem] mb-4">
            <label for="language" class="text-sm font-medium">Sprache</label>
            <Select
              id="language"
              v-model="language"
              :options="languages"
              placeholder="Sprache wählen"
            />
          </div>
          <div class="mt-2">
            <Button label="Einstellungen speichern" icon="pi pi-save" @click="saveSettings" />
          </div>
        </template>
      </Card>

      <!-- Card: Benachrichtigungen (Push) -->
      <NotificationCard :products="groceryStore.items" />

      <!-- Card: Darstellung -->
      <Card>
        <template #title>Darstellung</template>
        <template #content>
          <div class="flex items-center justify-between gap-4 mb-3">
            <span class="text-[0.95rem] flex-1">Dark Mode Simulation</span>
            <ToggleSwitch v-model="darkModeSimulation" />
          </div>
          <p class="text-[0.85rem] text-muted-color m-0 mt-1">
            <span v-if="darkModeSimulation"><strong>Dark Mode simuliert</strong></span>
            <span v-else>Standarddarstellung aktiv</span>
          </p>
        </template>
      </Card>

      <!-- Card: Prototyp-Daten -->
      <Card>
        <template #title>Prototyp-Daten</template>
        <template #content>
          <p class="text-[0.85rem] text-muted-color m-0">Nutze den Zurücksetzen-Button, um den Ausgangszustand wiederherzustellen.</p>
          <div class="mt-3">
            <Button
              label="Lokale Daten zurücksetzen"
              severity="danger"
              outlined
              icon="pi pi-trash"
              @click="resetPrototypeData"
            />
          </div>
          <Message v-if="resetMessageVisible" severity="success" :closable="false" class="mt-4">
            Lokale Daten wurden zurückgesetzt.
          </Message>
        </template>
      </Card>
    </div>
  </main>
</template>

<style scoped>
/* ── Full-width PrimeVue inputs inside form fields ───────── */
.form-field :deep(.p-inputtext),
.form-field :deep(.p-select) {
  width: 100%;
}

/* ── Mobile: full-width buttons ──────────────────────────── */
@media (max-width: 900px) {
  .actions .p-button,
  .danger-zone .p-button {
    width: 100%;
    justify-content: center;
  }
}
</style>
