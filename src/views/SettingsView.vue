<script setup lang="ts">
import { ref } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import ToggleSwitch from 'primevue/toggleswitch'
import Message from 'primevue/message'
import Divider from 'primevue/divider'
import { useGroceryStore } from '@/stores/groceryStore'

const groceryStore = useGroceryStore()

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
  <main class="settings-page">
    <div class="settings-header">
      <h1>Einstellungen</h1>
      <p>Verwaltung einfacher Prototyp-Einstellungen.</p>
    </div>

    <Message severity="info" :closable="false">
      Diese Einstellungen dienen der Simulation im Web-Prototyp und ersetzen kein vollständiges Benutzerkonto.
    </Message>

    <Divider />

    <div class="settings-grid">
      <!-- Card: Profil -->
      <Card>
        <template #title>Profil</template>
        <template #content>
          <div class="form-field">
            <label for="username">Benutzername</label>
            <InputText id="username" v-model="username" placeholder="Benutzername eingeben" />
          </div>
          <div class="form-field">
            <label for="language">Sprache</label>
            <Select
              id="language"
              v-model="language"
              :options="languages"
              placeholder="Sprache wählen"
            />
          </div>
          <div class="actions">
            <Button label="Einstellungen speichern" icon="pi pi-save" @click="saveSettings" />
          </div>
        </template>
      </Card>

      <!-- Card: Benachrichtigungen -->
      <Card>
        <template #title>Benachrichtigungen</template>
        <template #content>
          <div class="setting-row">
            <span class="setting-text">Erinnerungen für bald ablaufende Produkte</span>
            <ToggleSwitch v-model="notificationsEnabled" />
          </div>
          <p class="hint-text">
            <span v-if="notificationsEnabled">Benachrichtigungen sind im Prototyp aktiviert.</span>
            <span v-else>Benachrichtigungen sind deaktiviert.</span>
          </p>
        </template>
      </Card>

      <!-- Card: Darstellung -->
      <Card>
        <template #title>Darstellung</template>
        <template #content>
          <div class="setting-row">
            <span class="setting-text">Dark Mode Simulation</span>
            <ToggleSwitch v-model="darkModeSimulation" />
          </div>
          <p class="hint-text">
            <span v-if="darkModeSimulation">
              <strong>Dark Mode simuliert</strong>
            </span>
            <span v-else>Standarddarstellung aktiv</span>
          </p>
        </template>
      </Card>

      <!-- Card: Prototyp-Daten -->
      <Card>
        <template #title>Prototyp-Daten</template>
        <template #content>
          <p class="hint-text">
            Lokale Daten können zurückgesetzt werden, um den Ausgangszustand wiederherzustellen.
          </p>
          <div class="danger-zone">
            <Button
              label="Lokale Daten zurücksetzen"
              severity="danger"
              outlined
              icon="pi pi-trash"
              @click="resetPrototypeData"
            />
          </div>
          <Message v-if="resetMessageVisible" severity="success" :closable="false" class="reset-message">
            Lokale Daten wurden zurückgesetzt.
          </Message>
        </template>
      </Card>
    </div>
  </main>
</template>

<style scoped>
.settings-page {
  padding: 1.5rem;
  max-width: 1000px;
  margin: 0 auto;
}

.settings-header {
  margin-bottom: 1.5rem;
}

.settings-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 0.25rem;
}

.settings-header p {
  color: var(--p-text-muted-color, #6b7280);
  margin: 0;
}

.settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-bottom: 1rem;
}

.form-field label {
  font-size: 0.875rem;
  font-weight: 500;
}

.form-field :deep(.p-inputtext),
.form-field :deep(.p-select) {
  width: 100%;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.setting-text {
  font-size: 0.95rem;
  flex: 1;
}

.actions {
  margin-top: 0.5rem;
}

.danger-zone {
  margin-top: 0.75rem;
}

.hint-text {
  font-size: 0.85rem;
  color: var(--p-text-muted-color, #6b7280);
  margin: 0.25rem 0 0;
}

.reset-message {
  margin-top: 1rem;
}

@media (max-width: 900px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }

  .actions .p-button,
  .danger-zone .p-button {
    width: 100%;
    justify-content: center;
  }
}
</style>
