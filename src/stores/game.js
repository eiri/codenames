import { prng_alea } from 'esm-seedrandom';
import { ref, computed, inject } from 'vue'
import { defineStore } from 'pinia'

import { words } from '../assets/words.js'

export const useGameStore = defineStore('game', () => {


  const supabase = inject('supabase')
  const channel = supabase.channel('game') // FIXME game-${room number}
  channel.on('broadcast', {event: '*'}, (msg) => {
    switch (msg.event) {
      case 'open':
        open(msg.payload.idx)
        break;
      case 'newGame':
        gameKey.value = msg.payload.gameKey
        newGame()
    }
  }).subscribe((status) => {
    if (status == 'SUBSCRIBED') {
      console.log('subscribed to broadcast')
      subscribed.value = true
    }
  })

  let rnd = prng_alea('hello')

  const randomWord = () => {
    const randomIndex = Math.floor(rnd() * words.length);
    return words[randomIndex];
  }

  const board = ref([])
  const boardSize = ref(25)
  const gameKey = ref(randomWord())
  const score = ref({red: 0, blue: 0})
  const subscribed = ref(false)
  const gameOver = ref('none')
  const captainView = ref(false)

  const open = (idx) => {
    if (board.value[idx] && !board.value[idx].opened) {
      board.value[idx].opened = true
      switch (board.value[idx].kind) {
        case 'red':
          score.value.red -= 1
          if (score.value.red == 0) {
            gameOver.value = 'red'
          }
          break;
        case 'blue':
          score.value.blue -= 1
          if (score.value.blue == 0) {
            gameOver.value = 'blue'
          }
          break;
        case 'black':
          gameOver.value = 'black'
      }
      if (gameOver.value != 'none') {
        board.value.forEach((c) => c.opened = true)
      }
      if (subscribed.value) {
        channel.send({
          type: 'broadcast',
          event: 'open',
          payload: {idx}
        })
      }
    }
  }

  const newGame = () => {
    console.log(`new game ${gameKey.value}, board size ${boardSize.value}`)
    rnd = prng_alea(gameKey.value)
    // FIXME: refactor to uniqueRandomWords(size) as this can have duplicates
    const words = Array(boardSize.value).fill().map(randomWord)
    const red = Math.round((boardSize.value - 1) / 3)
    const blue = red - 1
    const white = boardSize.value - red - blue - 1
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
        word: words[i],
        opened: false
      })
    }

    score.value = {red, blue}
    captainView.value = false
    gameOver.value = 'none'
    if (subscribed.value) {
      channel.send({
        type: 'broadcast',
        event: 'newGame',
        payload: {gameKey: gameKey.value}
      })
    }
  }

  return { gameKey, boardSize, score, gameOver, captainView, subscribed,
    board, open, newGame, randomWord }
})
