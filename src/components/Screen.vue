<script setup>
import { ref, onMounted } from 'vue'
import { useWordsStore } from '../stores/words'

import Card from './Card.vue'


const { randomWords } = useWordsStore()
const words = ref([])

onMounted(() => {
  // cols, rows
  words.value = randomWords(5, 5)
})
</script>

<template>
  <div v-for="row, i in words" :key="i">
    <article v-for="word, j in row" :key="j">
      <Card :word="word" />
    </article>
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

article {
  margin: 1rem;
  height: 3rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
  transition: 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

article:hover {
  box-shadow: 0 8px 16px 0 rgba(0, 0, 0, 0.3);
}
</style>
