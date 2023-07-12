<script setup>
import { onMounted, onUnmounted } from 'vue'

import { useGameStore } from './stores/game.js'
import Info from './components/Info.vue'
import Controls from './components/Controls.vue'
import Screen from './components/Screen.vue'


const store = useGameStore()
const { connect, disconnect } = store

onMounted(() => {
  const username = localStorage.getItem("username")
  const room = localStorage.getItem("room")
  //FIXME: return to root with error if not found
  //FIXME: return to login with error if URL room doesn't match storage
  console.debug(`Game: onMounted ${username} ${room}`)
  connect()
})

onUnmounted(() => {
  console.debug('Game: onUnmounted')
  disconnect()
  store.$reset()
})
</script>

<template>
  <header>
    <Info />
  </header>
  <main>
    <Screen />
  </main>
  <footer>
    <Controls />
  </footer>
</template>

<style scoped>
header, main, footer {
  padding: 1rem;
}

header {
  box-shadow: var(--box-shadow-low);
}

</style>