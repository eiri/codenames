import { prng_alea } from 'esm-seedrandom';
import { ref, computed, inject } from 'vue'
import { defineStore } from 'pinia'

import { words } from '../assets/words.js'
import { CardState } from '../assets/states.js'

export const useGameStore = defineStore('game', () => {
  const uid = Math.random().toString(16).slice(2)
  let online = []
  console.log(`session uid ${uid}`)

  const supabase = inject('supabase')
  const channel = supabase.channel('game') // FIXME game-${room number}
  channel.on('broadcast', {event: '*'}, (msg) => {
    switch (msg.event) {
      case 'open':
        open(msg.payload.idx)
        break;
      case 'newGame':
        if (msg.payload.gameKey != gameKey.value) {
          gameKey.value = msg.payload.gameKey
          newGame()
        }
        break;
      case 'reqOnline':
        channel.send({
            type: 'broadcast',
            event: 'ackOnline',
            payload: {uid}
        })
        break;
      case 'ackOnline':
        online.push(msg.payload.uid)
        break;
      case 'reqState':
        if (msg.payload.uid == uid) {
          channel.send({
              type: 'broadcast',
              event: 'ackState',
              payload: {
                gameKey: gameKey.value,
                state: board.value.map((c) => c.state)
              }
          })
        }
        break;
      case 'ackState':
        console.log('subscribed to broadcast')
        console.log(msg.payload)
        gameKey.value = msg.payload.gameKey
        newGame()
        subscribed.value = true
    }
  }).subscribe((status) => {
    if (status == 'SUBSCRIBED') {
      channel.send({
          type: 'broadcast',
          event: 'reqOnline'
      })
      const wait = 600 // ms
      setTimeout(() => {
        if (online.length == 0) {
          // assume this client is the first one
          console.log('subscribed to broadcast')
          subscribed.value = true
        } else {
          // FIXME: race here if top ack client quit after ansering,
          // but that's ok for now
          channel.send({
              type: 'broadcast',
              event: 'reqState',
              payload: {uid: online[0]}
          })
        }
      }, wait)
    }
  })

  const board = ref([])
  const boardSize = ref(25)
  const gameKey = ref('room+date')
  const score = ref({red: 0, blue: 0})
  const subscribed = ref(false)
  const gameOver = ref('none')
  const captainView = ref(false)

  let rnd = prng_alea(gameKey.value)

  const randomWord = () => {
    const randomIndex = Math.floor(rnd() * words.length);
    return words[randomIndex];
  }

  const open = (idx) => {
    if (board.value[idx] && board.value[idx].closed()) {
      switch (board.value[idx].state) {
        case CardState.RedClosed:
          board.value[idx].state = CardState.RedOpened
          score.value.red -= 1
          if (score.value.red == 0) {
            gameOver.value = 'red'
          }
          break;
        case CardState.BlueClosed:
          board.value[idx].state = CardState.BlueOpened
          score.value.blue -= 1
          if (score.value.blue == 0) {
            gameOver.value = 'blue'
          }
          break;
        case CardState.BlackClosed:
          board.value[idx].state = CardState.BlackOpened
          gameOver.value = 'black'
          break;
        case CardState.WhiteClosed:
          board.value[idx].state = CardState.WhiteOpened
      }
      if (gameOver.value != 'none') {
        // all even are open, odds are closed, so just shift down
        board.value.forEach((c) => {
          if (c.closed()) {
            c.state -= 1
          }
        })
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

  const newCards = (size) => {
    const red = Math.round((size - 1) / 3)
    const blue = red - 1
    const white = size - red - blue - 1
    let cards = [CardState.BlackClosed]
      .concat(Array(red).fill(CardState.RedClosed))
      .concat(Array(blue).fill(CardState.BlueClosed))
      .concat(Array(white).fill(CardState.WhiteClosed))

    // Fisher-Yates shuffle
    for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
    }

    return {cards, score: {red, blue}}
  }

  const newWords = (size) => {
    // FIXME: refactor to uniqueRandomWords(size) as this can have duplicates
    return Array(size).fill().map(randomWord)
  }


  const newGame = () => {
    console.log(`new game ${gameKey.value}, board size ${boardSize.value}`)
    rnd = prng_alea(gameKey.value)
    const { cards, score } = newCards(boardSize.value)
    const words = newWords(boardSize.value)

    board.value = []
    for (let i in cards) {
      board.value.push({
        idx: i,
        state: cards[i],
        word: words[i],
        closed() { return this.state % 2 == 1 }
      })
    }

    score.value = score
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
