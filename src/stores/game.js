import { prng_alea } from 'esm-seedrandom';
import { ref, computed, inject } from 'vue'
import { defineStore } from 'pinia'

import { words } from '../assets/words.js'
import { CardState } from '../assets/states.js'

export const useGameStore = defineStore('game', () => {
  const uid = Math.random().toString(16).slice(2)
  let online = []
  console.log(`session uid ${uid}`)

  const broker = inject('broker')
  const channel = broker.channels.get('game') // FIXME game-${room number}

  channel.on('attached', (stateChange) => {
    channel.publish('reqOnline', {})
    const wait = 600 // ms
    setTimeout(() => {
      if (online.length == 0) {
        // assume this client is the first one
        console.log('subscribed to broadcast')
        subscribed.value = true
      } else {
        // FIXME: race here if top ack client quit after ansering,
        // but that's ok for now
        channel.publish('reqState', {uid: online[0]})
      }
    }, wait)
  })

  channel.subscribe(({name, data}) => {
    switch (name) {
      case 'open':
        open(data.idx)
        break;
      case 'newGame':
        if (data.gameKey != gameKey.value) {
          gameKey.value = data.gameKey
          newGame()
        }
        break;
      case 'reqOnline':
        channel.publish('ackOnline', {uid})
        break;
      case 'ackOnline':
        online.push(data.uid)
        break;
      case 'reqState':
        if (data.uid == uid) {
          channel.publish('ackState', {
            gameKey: gameKey.value,
            state: board.value.map((c) => c.state)
          })
        }
        break;
      case 'ackState':
        console.log('subscribed to broadcast')
        console.log(data)
        gameKey.value = data.gameKey
        newGame()
        subscribed.value = true
    }
  })

  const board = ref([])
  const boardSize = ref(25)
  const gameKey = ref('room+date')
  const subscribed = ref(false)
  const captainView = ref(false)

  let rnd = prng_alea(gameKey.value)

  const randomWord = () => {
    const randomIndex = Math.floor(rnd() * words.length);
    return words[randomIndex];
  }

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

    if (score.gameOver =='none' && score.red == 0) {
      score.gameOver = 'red'
    }

    if (score.gameOver =='none' && score.blue == 0) {
      score.gameOver = 'blue'
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

  const open = (idx) => {
    if (board.value[idx] && board.value[idx].closed()) {
      board.value[idx].state -= 1
      if (subscribed.value) {
        channel.publish('open', {idx})
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

    return cards
  }

  const newWords = (size) => {
    // FIXME: refactor to uniqueRandomWords(size) as this can have duplicates
    return Array(size).fill().map(randomWord)
  }


  const newGame = () => {
    console.log(`new game ${gameKey.value}, board size ${boardSize.value}`)
    rnd = prng_alea(gameKey.value)
    const cards = newCards(boardSize.value)
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

    captainView.value = false
    if (subscribed.value) {
      channel.publish('newGame', {gameKey: gameKey.value})
    }
  }

  return { gameKey, boardSize, score, captainView, subscribed,
    board, open, newGame, randomWord }
})
