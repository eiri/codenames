<script setup>
import { onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'

import Controls from './components/Controls.vue'
import Screen from './components/Screen.vue'
import { useGameStore } from './stores/game.js'


const store = useGameStore()
const { board } = storeToRefs(store)
const { connect, disconnect } = store

onMounted(() => {
  const username = localStorage.getItem("username")
  const room = localStorage.getItem("room")
  //FIXME: return to root with error if not found
  console.debug(`Game: onMounted ${username} ${room}`)
  connect()
})

onUnmounted(() => {
  console.debug('Game: onUnmounted')
  store.$reset()
  disconnect()
})
</script>

<template>
  <header>
    codenames
  </header>
  <main>
    <Screen :board="board" />
  </main>
  <footer>
    <Controls :board="board" />
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