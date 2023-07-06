import Ably from 'ably'

import { prng_alea } from 'esm-seedrandom';
import { ref, computed, inject } from 'vue'
import { defineStore } from 'pinia'

import { words } from '../assets/words.js'
import { CardState } from '../assets/states.js'

export const useGameStore = defineStore('game', () => {

  //FIXME throw error if any of those are empty strings/undefined
  const username = localStorage.getItem("username")
  const room = localStorage.getItem("room")

  const broker = inject('broker')
  let channel = broker.channels.get(`room${room}`)

  const boardSize = 25

  const board = ref(Array(boardSize).fill().map(() => {
    return {
      word: '',
      state: CardState.WhiteOpened,
      closed() { return this.state % 2 == 1 }
    }
  }))

  const gameKey = ref(self.crypto.randomUUID())
  let rnd = prng_alea(gameKey.value)

  const captainView = ref(false)

  const connect = () => {
    console.debug('connect')
    broker.connect()
  }

  broker.connection.on((stateChange) => {
    console.debug(`connection state ${JSON.stringify(stateChange)}`)
  })

  const disconnect = () => {
    console.debug('disconnect')
    broker.close()
  }

  /*
  FIXME: this is for future members list
  channel.presence.subscribe('enter', (member) => {
    console.log(`${member.clientId} entered`)
  });
  */

  const syncState = () => {
    channel.presence.get((err, members) => {
      if (err != null) {
          console.error(err)
          return
      }
      console.debug(`members: ${members.length}`)
      if (members.length == 0) {
        // assume this player is the first one
        console.debug(`subscribed: ok (${gameKey.value})`)
        nextGame()
        channel.presence.enterClient(username)
      } else {
        // FIXME: race here if top ack client quit after ansering,
        // but that's ok for now
        // ask game state from a first presented player
        const payload = {
          from: username,
          to: members[0].clientId,
        }
        console.debug(`publish reqState ${JSON.stringify(payload)}`)
        channel.publish('reqState', payload)
      }
    })
  }

  broker.connection.on('connected', syncState)

  channel.subscribe('reqState', ({data}) => {
    console.debug(`received reqState ${JSON.stringify(data)} as ${username}`)
    if (data.to != username) {
      return
    }
    const payload = {
      gameKey: gameKey.value,
      state: board.value.map(c => ({state: c.state, word: c.word})),
      to: data.from,
    }
    console.debug(`publish ackState ${JSON.stringify(payload)}`)
    channel.publish('ackState', payload)
  })

  channel.subscribe('ackState', ({data}) => {
    console.debug(`received ackState ${JSON.stringify(data)} as ${username}`)
    if (data.to != username || data.gameKey == gameKey.value) {
      return
    }
    gameKey.value = data.gameKey
    board.value = []
    for (let i in data.state) {
      const card = data.state[i]
      board.value.push({
        idx: i,
        state: card.state,
        word: card.word,
        closed() { return this.state % 2 == 1 }
      })
    }
    console.debug(`subscribed: ok (${gameKey.value})`)
    channel.presence.enterClient(username)
  })

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

  const open = (idx) => {
    if (board.value[idx] && board.value[idx].closed()) {
      const payload = { idx }
      console.debug(`publish open ${JSON.stringify(payload)}`)
      channel.publish('open', payload)
    }
  }

  channel.subscribe('open', ({data}) => {
    console.debug(`received open ${JSON.stringify(data)} as ${username}`)
    const idx = data.idx
    if (board.value[idx] && board.value[idx].closed()) {
      board.value[idx].state -= 1
    }
  })

  const randomCards = (size) => {
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

  const randomWord = () => {
    const randomIndex = Math.floor(rnd() * words.length);
    return words[randomIndex];
  }

  const randomWords = size => {
    // FIXME: refactor to uniqueRandomWords(size) as this can have duplicates
    return Array(size).fill().map(randomWord)
  }

  const nextWord = () => {
    let word = gameKey.value
    do { word = randomWord() } while (word == gameKey.value)
    return word
  }

  // FIXME: it is possible to get same board in a single session
  // so better is to keep fixed sized table of unique words
  // to make sure there are at least N unique boards
  const nextGame = () => {
    gameKey.value = nextWord()
    const payload = {gameKey: gameKey.value}
    console.debug(`publish nextGame ${JSON.stringify(payload)}`)
    channel.publish('nextGame', payload)
  }

  channel.subscribe('nextGame', ({data}) => {
    console.debug(`received nextGame ${JSON.stringify(data)} as ${username}`)
    gameKey.value = data.gameKey
    rnd = prng_alea(gameKey.value)
    buildGame()
  })

  const buildGame = () => {
    console.debug(`buildGame for ${gameKey.value}`)

    const cards = randomCards(boardSize)
    const words = randomWords(boardSize)

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
  }

  const $reset = () => {
    board.value = Array(boardSize).fill().map(() => {
      return {
        word: '',
        state: CardState.WhiteOpened,
        closed() { return this.state % 2 == 1 }
      }
    })
    gameKey.value = ''
    captainView.value = false
  }

  return { gameKey, score, captainView,
    board, open, connect, disconnect, nextGame, $reset }
})
