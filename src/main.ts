import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import 'primeicons/primeicons.css'
import App from './App.vue'
import router from './router'
import { IonicVue } from '@ionic/vue'
import '@ionic/vue/css/core.css'
import '@ionic/vue/css/normalize.css'
import '@ionic/vue/css/structure.css'
import '@ionic/vue/css/typography.css'

const app = createApp(App)

app.use(createPinia())
app.use(IonicVue)
app.use(router)
app.use(PrimeVue, {
  theme: {
    preset: Aura,
  },
})

router.isReady().then(() => {
  app.mount('#app')
})
