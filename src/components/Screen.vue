<script setup>
import { ref, toRefs } from 'vue'

import Card from './Card.vue'


const cols = ref(5)

const props = defineProps({
  board: {
    type: Array,
    required: true
  }
})

const { board } = toRefs(props);
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
