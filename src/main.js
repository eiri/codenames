import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import broker from './plugin/broker.js'
import App from './App.vue'

const app = createApp(App)

app.use(broker)
app.use(createPinia())

app.mount('#app')
