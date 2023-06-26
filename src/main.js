import './assets/main.css'

import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import { createPinia } from 'pinia'

import broker from './plugin/broker.js'
import App from './App.vue'
import Home from './Home.vue'
import Game from './Game.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {path: '/', component: Home},
    {path: '/game/:room', component: Game},
  ]
})

const app = createApp(App)

app.use(router)
app.use(broker)
app.use(createPinia())

app.mount('#app')
