<script setup>
import { ref } from 'vue'
import { storeToRefs } from 'pinia'

import { useGameStore } from './stores/game'

import Screen from './components/Screen.vue'


const store = useGameStore()

const { gameKey } = storeToRefs(store)
const { randomWord, newGame } = store

const nextGame = () => {
  gameKey.value = randomWord()
  newGame()
}
</script>

<template>
  <main>
    <Screen />
  </main>
  <footer>
    <button @click="nextGame">New game</button>
  </footer>
</template>

<style scoped>
header, main, footer {
  padding: 0.5rem;
}

button {
  font-size: 1vw;
  color: var(--vt-c-white-soft);
  background-color: var(--vt-c-beril-blue);
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
  transition: 0.3s;
  text-align: center;
  display: inline-block;
}

button:active {
  box-shadow: 0 0px 2px 0 rgba(0, 0, 0, 0.4);
  transform: translateY(2px);
}
</style>