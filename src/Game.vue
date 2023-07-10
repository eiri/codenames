<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'

import Info from './components/Info.vue'
import Controls from './components/Controls.vue'
import Screen from './components/Screen.vue'
import { useGameStore } from './stores/game.js'


const room = ref('')

const store = useGameStore()
const { gameKey, players, board } = storeToRefs(store)
const { connect, disconnect } = store

onMounted(() => {
  const username = localStorage.getItem("username")
  room.value = localStorage.getItem("room")
  //FIXME: return to root with error if not found
  //FIXME: return to login with error if URL room doesn't match storage
  console.debug(`Game: onMounted ${username} ${room.value}`)
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
    <Info :room="room" :gameKey="gameKey" :players="players" />
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