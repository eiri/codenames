<script setup>
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'

import { useGameStore } from '../stores/game'

import Card from './Card.vue'


const store = useGameStore()

const cols = ref(5)
const rows = ref(6)
const { board, boardSize } = storeToRefs(store)
const { newGame } = store

const idx = (col, row) => row * cols.value + col

onMounted(() => {
  boardSize.value = cols.value * rows.value
  newGame()
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
