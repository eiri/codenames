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
      <div class="middle-font" v-show="score.gameOver == 'none'">
        <img src="../assets/key.svg" />
        {{gameKey}}
      </div>
      <div class="large-font" v-show="score.gameOver == 'black'">
        Both teams lost
      </div>
      <div class="large-font red" v-show="score.gameOver == 'red'">
        Red team won
      </div>
      <div class="large-font blue" v-show="score.gameOver == 'blue'">
        Blue team won
      </div>
    </div>
    <div class="large-font red">
      {{ score.red }}
    </div>
    <div>
      <button @click="nextGame">New game</button>
    </div>
    <div class="large-font blue">
      {{ score.blue }}
    </div>
    <div>
      <input type="checkbox" id="captain" v-model="captainView" />
      <label for="captain">
        <img src="../assets/pirate-hat.svg" />
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
  margin: 1rem;
  /*border: 1px solid red;*/
}

.middle-font {
  font-size: 2rem;
  line-height: 2rem
}

.middle-font img {
  width: 1vw;
}

.large-font {
  font-size: 3rem;
}

.red {
  color: var(--vt-c-strawberry);
}

.blue {
  color: var(--vt-c-beril-blue);
}

img {
  width: 1.5vw;
  margin: auto;
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
  width: 1.5rem;
  height: 1.5rem;
  background: var(--color-background-soft);;
  border-radius: 1rem;
  transition: 0.1s;
}

input:checked + label {
  background: var(--vt-c-dark-sage);
}

input:checked + label:after {
  left: calc(100% - 5px);
  transform: translateX(-100%);
}
</style>