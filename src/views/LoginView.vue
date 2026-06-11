<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Divider from 'primevue/divider'

const router = useRouter()

const mode = ref<'welcome' | 'access' | 'login' | 'register'>('welcome')

const email = ref('demo@freshflow.local')
const password = ref('demo123')

const registerName = ref('')
const registerEmail = ref('')
const registerPassword = ref('')

const loginSuccess = ref(false)
const loginError = ref(false)

const registerSuccess = ref(false)
const registerError = ref(false)

const biometricLoading = ref(false)
const biometricSuccess = ref(false)
const biometricError = ref(false)

function resetMessages(): void {
  loginSuccess.value = false
  loginError.value = false
  registerSuccess.value = false
  registerError.value = false
  biometricSuccess.value = false
  biometricError.value = false
}

function showAccess(): void {
  mode.value = 'access'
  resetMessages()
}

function showLogin(): void {
  mode.value = 'login'
  resetMessages()
}

function showRegister(): void {
  mode.value = 'register'
  resetMessages()
}

function showWelcome(): void {
  mode.value = 'welcome'
  resetMessages()
}

function login(): void {
  if (email.value && password.value) {
    loginSuccess.value = true
    loginError.value = false
    localStorage.setItem(
      'smart-grocery-demo-user',
      JSON.stringify({ email: email.value, name: 'Demo User', loginMethod: 'demo-login' }),
    )
    setTimeout(() => router.push('/'), 1000)
  } else {
    loginError.value = true
    loginSuccess.value = false
  }
}

function register(): void {
  if (registerName.value && registerEmail.value && registerPassword.value) {
    registerSuccess.value = true
    registerError.value = false
    localStorage.setItem(
      'smart-grocery-demo-user',
      JSON.stringify({
        email: registerEmail.value,
        name: registerName.value,
        loginMethod: 'simulated-register',
      }),
    )
    setTimeout(() => router.push('/'), 1000)
  } else {
    registerError.value = true
    registerSuccess.value = false
  }
}

function continueAsGuest(): void {
  localStorage.setItem(
    'smart-grocery-demo-user',
    JSON.stringify({ email: 'guest@freshflow.local', name: 'Guest User', loginMethod: 'guest' }),
  )
  router.push('/')
}

function loginWithFingerprint(): void {
  biometricLoading.value = true
  biometricSuccess.value = false
  biometricError.value = false
  setTimeout(() => {
    localStorage.setItem(
      'smart-grocery-demo-user',
      JSON.stringify({
        email: 'biometric@freshflow.local',
        name: 'Biometric Demo User',
        loginMethod: 'fingerprint-simulation',
      }),
    )
    biometricLoading.value = false
    biometricSuccess.value = true
    setTimeout(() => router.push('/'), 1200)
  }, 1500)
}
</script>

<template>
  <main class="access-page">

    <!-- ═══ WELCOME MODE ═══ -->
    <div v-if="mode === 'welcome'" class="welcome-full">
      <div class="brand-badge">
        <i class="pi pi-leaf" />
      </div>
      <h1 class="brand-title">FreshFlow</h1>
      <p class="brand-subtitle">Smart Grocery Assistant</p>
      <p class="brand-description">
        Organisiere deinen Vorrat, plane Einkäufe einfacher und behalte Ablaufdaten sowie Reste im Blick.
      </p>
      <ul class="feature-list">
        <li class="feature-item">
          <i class="pi pi-check-circle" />
          <span>Lebensmittel im Blick behalten</span>
        </li>
        <li class="feature-item">
          <i class="pi pi-shopping-cart" />
          <span>Einkaufsliste schneller planen</span>
        </li>
        <li class="feature-item">
          <i class="pi pi-clock" />
          <span>Ablaufdaten rechtzeitig erkennen</span>
        </li>
      </ul>
      <Button
        label="Loslegen"
        icon="pi pi-arrow-right"
        iconPos="right"
        class="start-button"
        @click="showAccess"
      />
    </div>

    <!-- ═══ ACCESS / LOGIN / REGISTER ═══ -->
    <div v-else class="access-layout">

      <!-- ── Brand panel (condensed) ───────────────────── -->
      <aside class="welcome-panel">
        <div class="brand-badge">
          <i class="pi pi-leaf" />
        </div>
        <h1 class="brand-title">FreshFlow</h1>
        <p class="brand-subtitle">Smart Grocery Assistant</p>
        <p class="brand-description">
          Verwalte Lebensmittel, Einkaufsliste und Ablaufdaten.
        </p>
        <ul class="feature-list">
          <li class="feature-item">
            <i class="pi pi-check-circle" />
            <span>Lebensmittel im Blick behalten</span>
          </li>
          <li class="feature-item">
            <i class="pi pi-shopping-cart" />
            <span>Einkaufsliste schneller planen</span>
          </li>
          <li class="feature-item">
            <i class="pi pi-clock" />
            <span>Ablaufdaten rechtzeitig erkennen</span>
          </li>
        </ul>
        <p class="prototype-note">
          Hilft dir dabei, Lebensmittel bewusster zu nutzen und unnötige Einkäufe zu vermeiden.
        </p>
      </aside>

      <!-- ── Card column ────────────────────────────────── -->
      <div class="access-card-col">

        <!-- ═══ ACCESS MODE ═══ -->
        <Card v-if="mode === 'access'" class="access-card">
          <template #title>Willkommen</template>
          <template #subtitle>Wähle, wie du FreshFlow verwenden möchtest.</template>
          <template #content>
            <Message severity="info" :closable="false" class="mb-msg">
              Der Zugang wird im Web-Prototyp simuliert. Es wird keine echte Authentifizierung durchgeführt.
            </Message>
            <div class="access-actions">
              <Button
                label="Anmelden"
                icon="pi pi-sign-in"
                class="full-width"
                @click="showLogin"
              />
              <Button
                label="Registrieren"
                icon="pi pi-user-plus"
                severity="secondary"
                outlined
                class="full-width"
                @click="showRegister"
              />
              <Divider align="center"><span class="divider-text">oder</span></Divider>
              <Button
                label="Als Gast fortfahren"
                icon="pi pi-user"
                severity="secondary"
                outlined
                class="full-width"
                @click="continueAsGuest"
              />
            </div>
            <Button
              label="Zurück zur Startseite"
              icon="pi pi-arrow-left"
              text
              class="back-button back-top"
              @click="showWelcome"
            />
          </template>
        </Card>

        <!-- ═══ LOGIN MODE ═══ -->
        <Card v-else-if="mode === 'login'" class="access-card">
          <template #title>Anmelden</template>
          <template #subtitle>Melde dich mit Demo-Zugangsdaten an.</template>
          <template #content>
            <Button
              label="Zurück"
              icon="pi pi-arrow-left"
              text
              class="back-button"
              @click="showAccess"
            />
            <Message severity="info" :closable="false" class="mb-msg">
              Demo-Zugang: Es wird keine echte Authentifizierung durchgeführt.
            </Message>
            <div class="form-grid">
              <div class="form-field">
                <label for="login-email">E-Mail</label>
                <InputText
                  id="login-email"
                  v-model="email"
                  type="email"
                  placeholder="demo@freshflow.local"
                  autocomplete="email"
                />
              </div>
              <div class="form-field">
                <label for="login-password">Passwort</label>
                <Password
                  id="login-password"
                  v-model="password"
                  :feedback="false"
                  toggleMask
                  placeholder="Passwort eingeben"
                  autocomplete="current-password"
                  @keyup.enter="login"
                />
              </div>
            </div>
            <Button
              label="Einloggen"
              icon="pi pi-sign-in"
              class="full-width"
              @click="login"
            />
            <Message v-if="loginSuccess" severity="success" :closable="false" class="mt-msg">
              Login erfolgreich. Weiterleitung zum Dashboard...
            </Message>
            <Message v-if="loginError" severity="error" :closable="false" class="mt-msg">
              Bitte E-Mail und Passwort eingeben.
            </Message>

            <div class="biometric-section">
              <Divider align="center">
                <span class="divider-text">Biometrische Anmeldung</span>
              </Divider>
              <Message severity="info" :closable="false" class="mb-msg">
                Die Fingerabdruck-Anmeldung wird im Web-Prototyp nur simuliert. Eine echte
                biometrische Authentifizierung kann später in der Capacitor-Variante untersucht
                werden.
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
              <Message v-if="biometricSuccess" severity="success" :closable="false" class="mt-msg">
                Biometrische Anmeldung erfolgreich. Weiterleitung zum Dashboard...
              </Message>
              <Message v-if="biometricError" severity="error" :closable="false" class="mt-msg">
                Biometrische Anmeldung konnte nicht durchgeführt werden.
              </Message>
            </div>
          </template>
        </Card>

        <!-- ═══ REGISTER MODE ═══ -->
        <Card v-else class="access-card">
          <template #title>Registrieren</template>
          <template #subtitle>Erstelle ein simuliertes Demo-Profil.</template>
          <template #content>
            <Button
              label="Zurück"
              icon="pi pi-arrow-left"
              text
              class="back-button"
              @click="showAccess"
            />
            <Message severity="info" :closable="false" class="mb-msg">
              Die Registrierung wird nur simuliert. Es wird kein echtes Konto erstellt.
            </Message>
            <div class="form-grid">
              <div class="form-field">
                <label for="reg-name">Name</label>
                <InputText
                  id="reg-name"
                  v-model="registerName"
                  placeholder="Dein Name"
                  autocomplete="name"
                />
              </div>
              <div class="form-field">
                <label for="reg-email">E-Mail</label>
                <InputText
                  id="reg-email"
                  v-model="registerEmail"
                  type="email"
                  placeholder="deine@email.de"
                  autocomplete="email"
                />
              </div>
              <div class="form-field">
                <label for="reg-password">Passwort</label>
                <Password
                  id="reg-password"
                  v-model="registerPassword"
                  :feedback="false"
                  toggleMask
                  placeholder="Passwort wählen"
                  autocomplete="new-password"
                />
              </div>
            </div>
            <Button
              label="Registrieren"
              icon="pi pi-user-plus"
              class="full-width"
              @click="register"
            />
            <Message v-if="registerSuccess" severity="success" :closable="false" class="mt-msg">
              Registrierung erfolgreich. Weiterleitung zum Dashboard...
            </Message>
            <Message v-if="registerError" severity="error" :closable="false" class="mt-msg">
              Bitte alle Felder ausfüllen.
            </Message>
          </template>
        </Card>

      </div>

    </div>
  </main>
</template>

<style scoped>
/* ── Page ──────────────────────────────────────────────── */
.access-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1.5rem;
  background: linear-gradient(135deg, #f0fdf4 0%, #f9fafb 55%, #ecfdf5 100%);
}
/* ── Welcome Full (standalone welcome page) ──────────────── */
.welcome-full {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1rem;
  max-width: 500px;
  width: 100%;
  padding: 2rem 1.5rem;
}

.welcome-full .brand-badge {
  width: 80px;
  height: 80px;
  margin-bottom: 0.5rem;
}

.welcome-full .brand-badge .pi {
  font-size: 2.2rem;
}

.welcome-full .brand-title {
  font-size: 3rem;
}

.welcome-full .brand-description {
  max-width: 420px;
  font-size: 1rem;
}

.welcome-full .feature-list {
  align-self: stretch;
  max-width: 360px;
  margin: 0 auto;
}

.welcome-full .feature-item {
  justify-content: center;
}

.welcome-full .prototype-note {
  max-width: 380px;
}

/* ── Start button ─────────────────────────────────────────── */
.start-button {
  margin-top: 0.5rem;
  padding: 0.75rem 2.25rem;
  font-size: 1.05rem;
  font-weight: 600;
}

/* ── Back button (top of access card) ────────────────── */
.back-top {
  margin-top: 0.75rem;
  padding-left: 0;
}
/* ── Two-column layout ─────────────────────────────────── */
.access-layout {
  width: 100%;
  max-width: 1100px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: center;
}

/* ── Welcome Panel ─────────────────────────────────────── */
.welcome-panel {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 1rem 0;
}

.brand-badge {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #16a34a, #4ade80);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(22, 163, 74, 0.3);
  margin-bottom: 0.25rem;
}

.brand-badge .pi {
  font-size: 1.7rem;
  color: #fff;
}

.brand-title {
  font-size: 2.6rem;
  font-weight: 800;
  margin: 0;
  color: #111827;
  letter-spacing: -0.75px;
  line-height: 1.1;
}

.brand-subtitle {
  font-size: 1.05rem;
  font-weight: 600;
  color: #16a34a;
  margin: 0;
}

.brand-description {
  font-size: 0.95rem;
  color: #4b5563;
  margin: 0.25rem 0 0.25rem;
  line-height: 1.65;
  max-width: 380px;
}

/* Feature list */
.feature-list {
  list-style: none;
  margin: 0.5rem 0 0.25rem;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  font-size: 0.9rem;
  color: #374151;
  font-weight: 500;
}

.feature-item .pi {
  font-size: 1rem;
  color: #16a34a;
  flex-shrink: 0;
  width: 1.1rem;
  text-align: center;
}

.prototype-note {
  font-size: 0.78rem;
  color: #9ca3af;
  margin: 0.25rem 0 0;
  line-height: 1.5;
  max-width: 360px;
}

/* ── Access Card Column ────────────────────────────────── */
.access-card-col {
  width: 100%;
}

.access-card {
  width: 100%;
  border-radius: 16px !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1) !important;
  border: 1px solid #e5e7eb !important;
  overflow: hidden;
}

/* ── Actions (welcome mode) ────────────────────────────── */
.access-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* ── Form ──────────────────────────────────────────────── */
.form-grid {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  margin-bottom: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-bottom: 0.85rem;
}

.form-field label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.form-field :deep(.p-inputtext),
.form-field :deep(.p-password),
.form-field :deep(.p-password .p-inputtext) {
  width: 100%;
}

/* ── Utilities ─────────────────────────────────────────── */
.full-width {
  width: 100%;
  justify-content: center;
}

.back-button {
  margin-bottom: 0.5rem;
  padding-left: 0;
}

.divider-text {
  font-size: 0.8rem;
  color: #9ca3af;
  white-space: nowrap;
}

.mb-msg {
  margin-bottom: 1rem;
}

.mt-msg {
  margin-top: 0.75rem;
}

/* ── Biometric Section ─────────────────────────────────── */
.biometric-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

/* ── Responsive ────────────────────────────────────────── */
@media (max-width: 760px) {
  .access-layout {
    grid-template-columns: 1fr;
    gap: 1.75rem;
    max-width: 460px;
  }

  .welcome-panel {
    align-items: center;
    text-align: center;
    padding: 0;
  }

  .brand-description,
  .prototype-note {
    max-width: 100%;
  }

  .feature-item {
    justify-content: center;
  }

  .access-page {
    align-items: flex-start;
    padding: 1.5rem 1rem;
  }
}
</style>
