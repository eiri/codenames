<script setup>
import { ref } from 'vue'
import { storeToRefs } from 'pinia'

import { useGameStore } from '@/stores/game.js'
import Card from '@/components/Card.vue'


const cols = ref(5)
const store = useGameStore()
const { board } = storeToRefs(store)
</script>

<template>
  <div>
    <Card class="card" v-for="(card, i) in board" :key="i" :card="card" />
  </div>
</template>

<style scoped>
div {
  display: grid;
  grid-template-columns: repeat(v-bind('cols'), minmax(250px, 1fr));
  gap: 1rem;
}

.card {
  margin: 1rem;
}
</style>
