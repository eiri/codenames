import {prng_alea} from 'esm-seedrandom';
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

import { words } from '../assets/words.js'

export const useGameStore = defineStore('game', () => {

  let rnd = prng_alea('hello')

  // FIXME! can generate duplicates!
  const randomWord = () => {
    const randomIndex = Math.floor(rnd() * words.length);
    return words[randomIndex];
  }

  const board = ref([])
  const boardSize = ref(25)
  const gameKey = ref(randomWord())

  const open = (idx) => {
    if (board.value[idx]) {
      board.value[idx].opened = true
    }
  }

  const newGame = () => {
    console.log(`new game ${gameKey.value}, board size ${boardSize.value}`)
    rnd = prng_alea(gameKey.value)
    let red = Math.round((boardSize.value - 1) / 3)
    let blue = red - 1
    let white = boardSize.value - red - blue - 1
    let cards = ['black']
      .concat(Array(red).fill('red'))
      .concat(Array(blue).fill('blue'))
      .concat(Array(white).fill('white'))

    // Fisher-Yates shuffle
    for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
    }

    board.value = []
    for (let i in cards) {
      board.value.push({
        idx: i,
        kind: cards[i],
        word: randomWord(),
        opened: false
      })
    }
  }

  return { gameKey, boardSize, board, open, newGame, randomWord }
})
