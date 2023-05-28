<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useWordsStore } from '../stores/words'

import Card from './Card.vue'


const { randomWords } = useWordsStore()

const board = ref([])
const cols = ref(5)
const rows = ref(6)

const makeBoard = (words) => {
  const total = words.length
  let red = Math.round((total - 1) / 3)
  let blue = red - 1
  let white = total - red - blue - 1
  let cards = ['black']
    .concat(Array(red).fill('red'))
    .concat(Array(blue).fill('blue'))
    .concat(Array(white).fill('white'))

  // Fisher-Yates shuffle
  for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
  }

  for (let i in cards) {
    board.value.push({
      kind: cards[i],
      word: words[i],
      opened: false
    })
  }
}

const card = (col, row) => {
  if (board.value.length == 0) {
    return {}
  }
  const idx = row * cols.value + col
  return board.value[idx]
}

onMounted(() => {
  const words = randomWords(cols.value * rows.value)
  makeBoard(words)
})
</script>

<template>
  <div v-for="(n, row) in rows" :key="row">
    <Card
      class="card"
      v-for="(n, col) in cols"
      :key="col"
      :card="card(col, row)"
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
