import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import supabase from './plugin/supabase.js'
import App from './App.vue'

const app = createApp(App)

app.use(supabase)
app.use(createPinia())

app.mount('#app')
