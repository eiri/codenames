<script setup>
import { toRefs, computed } from 'vue'
import { storeToRefs } from 'pinia'

import { useGameStore } from '../stores/game'
import { CardState } from '../assets/states'


const props = defineProps({
  board: {
    type: Array,
    required: true
  }
})

const { board } = toRefs(props)

const score = computed(() => {
  let score = {red: 0, blue: 0, gameOver: 'none'}

  board.value.forEach((c) => {
    switch (c.state) {
      case CardState.RedClosed:
        score.red += 1
        break;
      case CardState.BlueClosed:
        score.blue += 1
        break;
      case CardState.BlackOpened:
        score.gameOver = 'black'
     }
  })

  if (score.gameOver == 'none' && score.red == 0) {
    score.gameOver = 'red'
  }

  if (score.gameOver == 'none' && score.blue == 0) {
    score.gameOver = 'blue'
  }

  if (score.red == 0 && score.blue == 0) {
    score.gameOver = 'waiting'
  }

  /*
  FIXME: maybe add later if we want this behaviour
  if (score.gameOver != 'none') {
    // all even are open, odds are closed, so just shift down
    board.value.forEach((c) => {
      if (c.closed()) {
        c.state -= 1
      }
    })
  }
  */

  return score
})

const store = useGameStore()
const { gameKey, captainView } = storeToRefs(store)
const { nextGame } = store
</script>

<template>
  <div class="wrapper">
    <div>
      <div v-show="score.gameOver == 'none'">
        <img class="key" src="../assets/key.svg" />
        {{gameKey}}
      </div>
      <div v-show="score.gameOver == 'black'">
        Both teams lost
      </div>
      <div class="red" v-show="score.gameOver == 'red'">
        Red team won
      </div>
      <div class="blue" v-show="score.gameOver == 'blue'">
        Blue team won
      </div>
    </div>
    <div class="red">
      {{ score.red }}
    </div>
    <div>
      <button @click="nextGame">New game</button>
    </div>
    <div class="blue">
      {{ score.blue }}
    </div>
    <div>
      <input type="checkbox" id="captain" v-model="captainView" />
      <label for="captain">
        <img src="../assets/crown.svg" />
      </label>
    </div>
    <div>
      <router-link to="/">
        <img src="../assets/logout.svg" />
      </router-link>
    </div>
  </div>
</template>

<style scoped>
div.wrapper {
  display: grid;
  grid-template-columns: repeat(4, 1fr) 0.68fr 0.28fr;
  gap: 1rem;
  /*border: 1px solid blue;*/
}

.wrapper > div {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: row;
  /*border: 1px solid red;*/
}

div {
  font-size: 2.4rem;
  line-height: 2.4rem;
}

img {
  width: 2rem;
  margin: auto;
}

.key {
  position: relative;
  top: 0.4rem;
  right: -0.2rem;
  width: 2rem;
}

.red {
  color: var(--color-red);
}

.blue {
  color: var(--color-blue);
}


/*
img.down {
  opacity: 0.2;
}
*/

button {
  cursor: pointer;
  font-family: var(--font-serif);
  font-size: 2rem;
  width: 100%;
  height: 3rem;
  padding: 0 1rem;
  margin: 0;
  color: var(--color-text-light);
  background-color: var(--color-green);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  box-shadow: var(--box-shadow-high);
  transition: 0.1s;
  text-align: center;
  display: inline-block;
}

button:active {
  box-shadow: var(--box-shadow-low);
  transform: translateY(2px);
}

input[type=checkbox]{
  height: 0;
  width: 0;
  visibility: hidden;
}

label {
  cursor: pointer;
  width: 3rem;
  height: 2rem;
  text-indent: -2.2rem;
  background: var(--color-background-soft);
  display: block;
  border-radius: 1rem;
  position: relative;
}

label:after {
  content: '';
  position: absolute;
  top: 0.2rem;
  left: 0.2rem;
  width: 1.5rem;
  height: 1.5rem;
  background: var(--color-text-light);
  border-radius: 1rem;
  transition: 0.1s;
}

input:checked + label {
  background: var(--color-green);
}

input:checked + label:after {
  left: calc(100% - 5px);
  transform: translateX(-100%);
}
</style>