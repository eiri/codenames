<script setup>
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'

import { useGameStore } from '../stores/game'

import Card from './Card.vue'


const store = useGameStore()

const cols = ref(5)
const rows = ref(6)
const { board } = storeToRefs(store)
const { card, newGame } = store

const idx = (col, row) => row * cols.value + col

onMounted(() => {
  newGame(cols.value * rows.value)
})
</script>

<template>
  <div v-for="(n, row) in rows" :key="row">
    <Card
      class="card"
      v-for="(n, col) in cols"
      :key="col"
      :card="card(idx(col, row))"
    />
  </div>
</template>

<style scoped>
h1 {
  font-weight: 600;
  font-size: 36px;
}

div {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

.card {
  margin: 1rem;
}
</style>
