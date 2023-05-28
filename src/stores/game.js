import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

import { words } from '../assets/words.js'

export const useGameStore = defineStore('game', () => {
  // FIXME! can generate duplicates!
  const randomWord = () => {
    const randomIndex = Math.floor(Math.random() * words.length);
    return words[randomIndex];
  }

  const board = ref([])

  const open = (idx) => {
    if (board.value[idx]) {
      board.value[idx].opened = true
    }
  }

  const card = (idx) => {
    if (!board.value[idx]) {
      return {word: '?', kind: 'white', opened: false}
    }
    return board.value[idx]
  }

  const newGame = (total) => {
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
        idx: i,
        kind: cards[i],
        word: randomWord(),
        opened: false
      })
    }
  }

  return { board, card, open, newGame }
})
