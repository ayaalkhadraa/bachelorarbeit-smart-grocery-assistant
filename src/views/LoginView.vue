<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Divider from 'primevue/divider'
import InputText from 'primevue/inputtext'
import Card from 'primevue/card'

const router = useRouter()

// Normal login
const email = ref('')
const password = ref('')
const loginError = ref(false)

function loginWithCredentials(): void {
  if (!email.value || !password.value) {
    loginError.value = true
    return
  }
  loginError.value = false
  localStorage.setItem(
    'smart-grocery-demo-user',
    JSON.stringify({
      email: email.value,
      name: 'Demo User',
      loginMethod: 'credentials-simulation',
    }),
  )
  router.push('/')
}

function loginAsGuest(): void {
  localStorage.setItem(
    'smart-grocery-demo-user',
    JSON.stringify({
      email: 'gast@smartgrocery.local',
      name: 'Gast',
      loginMethod: 'guest',
    }),
  )
  router.push('/')
}

// Biometric
const biometricLoading = ref(false)
const biometricSuccess = ref(false)
const biometricError = ref(false)

function loginWithFingerprint(): void {
  biometricLoading.value = true
  biometricSuccess.value = false
  biometricError.value = false

  setTimeout(() => {
    localStorage.setItem(
      'smart-grocery-demo-user',
      JSON.stringify({
        email: 'biometric@smartgrocery.local',
        name: 'Biometric Demo User',
        loginMethod: 'fingerprint-simulation',
      }),
    )
    biometricLoading.value = false
    biometricSuccess.value = true

    setTimeout(() => {
      router.push('/')
    }, 1200)
  }, 1500)
}
</script>

<template>
  <main class="login-page">
    <div class="login-container">
      <Card class="login-card">
        <template #header>
          <div class="login-logo">
            <i class="pi pi-shopping-cart logo-icon" />
            <h1>Smart Grocery</h1>
            <p class="subtitle">Web-Prototyp – Anmeldung</p>
          </div>
        </template>

        <template #content>
          <!-- Normal login -->
          <div class="form-field">
            <label for="email">E-Mail</label>
            <InputText
              id="email"
              v-model="email"
              type="email"
              placeholder="demo@beispiel.de"
              autocomplete="email"
            />
          </div>
          <div class="form-field">
            <label for="password">Passwort</label>
            <InputText
              id="password"
              v-model="password"
              type="password"
              placeholder="Passwort eingeben"
              autocomplete="current-password"
              @keyup.enter="loginWithCredentials"
            />
          </div>

          <Message v-if="loginError" severity="error" :closable="false" class="field-message">
            Bitte E-Mail und Passwort eingeben.
          </Message>

          <Button
            label="Anmelden"
            icon="pi pi-sign-in"
            class="full-width"
            @click="loginWithCredentials"
          />

          <!-- Guest login -->
          <Divider align="center">
            <span class="divider-text">oder</span>
          </Divider>

          <Button
            label="Als Gast fortfahren"
            icon="pi pi-user"
            severity="secondary"
            outlined
            class="full-width"
            @click="loginAsGuest"
          />

          <!-- Biometric section -->
          <Divider align="center">
            <span class="divider-text">Biometrische Anmeldung</span>
          </Divider>

          <div class="biometric-section">
            <Message severity="info" :closable="false" class="field-message">
              Die Fingerabdruck-Anmeldung wird im Web-Prototyp nur simuliert. Eine echte
              biometrische Authentifizierung wird später in der Capacitor-Variante untersucht.
            </Message>

            <Button
              label="Mit Fingerabdruck anmelden"
              icon="pi pi-lock"
              severity="secondary"
              outlined
              :loading="biometricLoading"
              class="full-width"
              @click="loginWithFingerprint"
            />

            <Message
              v-if="biometricSuccess"
              severity="success"
              :closable="false"
              class="field-message"
            >
              Biometrische Anmeldung erfolgreich. Weiterleitung zum Dashboard...
            </Message>

            <Message
              v-if="biometricError"
              severity="error"
              :closable="false"
              class="field-message"
            >
              Biometrische Anmeldung konnte nicht durchgeführt werden.
            </Message>
          </div>
        </template>
      </Card>
    </div>
  </main>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: var(--p-surface-ground, #f9fafb);
}

.login-container {
  width: 100%;
  max-width: 420px;
}

.login-card {
  width: 100%;
}

.login-logo {
  text-align: center;
  padding: 2rem 1rem 0.5rem;
}

.logo-icon {
  font-size: 2.5rem;
  color: var(--p-primary-color, #22c55e);
}

.login-logo h1 {
  font-size: 1.6rem;
  font-weight: 700;
  margin: 0.5rem 0 0.25rem;
}

.subtitle {
  color: var(--p-text-muted-color, #6b7280);
  font-size: 0.875rem;
  margin: 0;
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

.form-field :deep(.p-inputtext) {
  width: 100%;
}

.full-width {
  width: 100%;
  justify-content: center;
}

.divider-text {
  font-size: 0.8rem;
  color: var(--p-text-muted-color, #6b7280);
  white-space: nowrap;
}

.biometric-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.field-message {
  margin-bottom: 0.5rem;
}

.hint-text {
  font-size: 0.8rem;
  color: var(--p-text-muted-color, #6b7280);
  margin: 0;
}
</style>
