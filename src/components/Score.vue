<script setup>
import { storeToRefs } from 'pinia'

import { useGameStore } from '../stores/game'


const store = useGameStore()

const { gameKey, score, captainView } = storeToRefs(store)
const { randomWord, newGame } = store

const nextGame = () => {
  gameKey.value = randomWord()
  newGame()
}
</script>

<template>
  <div class="wrapper">
    <div class="score red">{{ score.red }}</div>
    <button @click="nextGame">New game</button>
    <div class="score blue">{{ score.blue }}</div>
  </div>
</template>

<style scoped>
div.wrapper {
  display: grid;
  grid-template-columns: 2fr 1fr 2fr;
  gap: 1rem;
}

button {
  cursor: pointer;
  font-family: var(--font-sans);
  font-size: 1.5vw;
  height: 3rem;
  padding: 0 1rem;
  margin: 0 1rem;
  color: var(--vt-c-white-soft);
  background-color: var(--vt-c-dark-sage);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
  transition: 0.1s;
  text-align: center;
  display: inline-block;
}

button:active {
  box-shadow: 0 0px 2px 0 rgba(0, 0, 0, 0.4);
  transform: translateY(2px);
}

.score {
  font-family: var(--font-sans);
  font-size: 3vw;
  display: flex;
  align-items: center;
  justify-content: center;
}

.red {
  color: var(--vt-c-strawberry);
}

.blue {
  color: var(--vt-c-beril-blue);
}
</style>