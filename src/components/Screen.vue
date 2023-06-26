<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'

import { useGameStore } from '../stores/game'

import Card from './Card.vue'


const store = useGameStore()

const cols = ref(5)
const rows = ref(5)
const { board, boardSize } = storeToRefs(store)
const { connect, disconnect, newGame } = store

const idx = (col, row) => row * cols.value + col

onMounted(() => {
  console.log('Screen: onMounted')

  const username = localStorage.getItem("username")
  connect(username)

  boardSize.value = cols.value * rows.value
  newGame()
})

onUnmounted(() => {
  console.log('Screen: onUnmounted')
  store.$reset()
  disconnect()
})
</script>

<template>
  <div>
    <Card class="card" v-for="(card, i) in board" :key="i" :card="card" />
  </div>
</template>

<style scoped>
div {
  display: grid;
  grid-template-columns: repeat(v-bind('cols'), minmax(200px, 1fr));
  gap: 1rem;
}

.card {
  margin: 1rem;
}
</style>
