import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import 'primeicons/primeicons.css'
import App from './App.vue'
import router from './router'
import { IonicVue } from '@ionic/vue'
const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(IonicVue)
app.use(PrimeVue, {
  theme: {
    preset: Aura,
  },
})

app.mount('#app')
