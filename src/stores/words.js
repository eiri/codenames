import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

import { words } from '../assets/words.js'

export const useWordsStore = defineStore('words', () => {
  // FIXME! can generate duplicates!
  const randomWord = () => {
    const randomIndex = Math.floor(Math.random() * words.length);
    return words[randomIndex];
  }

  const randomWords = (cols, rows) => {
    return Array(rows).fill().map(() =>
      Array(cols).fill().map(randomWord)
    )
  }

  return { randomWords }
})
