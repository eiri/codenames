<script setup>
import { onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'

import Info from './components/Info.vue'
import Screen from './components/Screen.vue'
import { useGameStore } from './stores/game'


const store = useGameStore()
const { board } = storeToRefs(store)
const { connect, disconnect, newGame } = store

onMounted(() => {
  console.log('Game: onMounted')

  const username = localStorage.getItem("username")
  connect(username)

  newGame()
})

onUnmounted(() => {
  console.log('Game: onUnmounted')
  store.$reset()
  disconnect()
})
</script>

<template>
  <main>
    <Screen :board="board" />
  </main>
  <footer>
    <Info />
  </footer>
</template>

<style scoped>
header, main, footer {
  padding: 0.5rem;
}
</style>