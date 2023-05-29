<script setup>
import { storeToRefs } from 'pinia'

import { useGameStore } from '../stores/game'


const store = useGameStore()
const { gameKey, captainView } = storeToRefs(store)
</script>

<template>
  <div class="wrapper">
    <div>{{ gameKey }}</div>
    <div>
      <input type="checkbox" id="captain" v-model="captainView" />
      <label for="captain">
        <img src="../assets/crown.svg" />
      </label>
    </div>
  </div>
</template>

<style scoped>
div.wrapper {
  display: grid;
  grid-template-columns: 4fr 1fr;
  gap: 1rem;
}

.wrapper div {
  font-family: var(--font-sans);
  display: flex;
  align-items: center;
  justify-content: center;
}

input[type=checkbox]{
  height: 0;
  width: 0;
  visibility: hidden;
}

label {
  cursor: pointer;
  font-family: var(--font-sans);
  text-indent: -2rem;
  /*text-indent: -9999px;*/
  width: 4rem;
  height: 2rem;
  background: var(--vt-c-divider-light-1);
  display: block;
  border-radius: 1rem;
  position: relative;
}

label:after {
  content: '';
  position: absolute;
  top: 0.2rem;
  left: 0.2rem;
  width: 1.6rem;
  height: 1.6rem;
  background: var(--color-background-soft);;
  border-radius: 2.8rem;
  transition: 0.1s;
}

label img {
  height: 2rem;
}

input:checked + label {
  background: var(--vt-c-dark-sage);
}

input:checked + label:after {
  left: calc(100% - 5px);
  transform: translateX(-100%);
}
</style>