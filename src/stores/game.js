import { prng_alea } from 'esm-seedrandom';
import { ref, computed, inject } from 'vue'
import { defineStore } from 'pinia'

import { words } from '../assets/words.js'
import { CardState } from '../assets/states.js'

export const useGameStore = defineStore('game', () => {
  const broker = inject('broker')

  let server = undefined
  let channel = undefined

  const boardSize = 25

  const board = ref(Array(boardSize).fill().map(() => {
    return {
      word: 'колокольня',
      state: CardState.WhiteClosed,
      closed() { return this.state % 2 == 1 }
    }
  }))

  const gameKey = ref('')
  const subscribed = ref(false)
  const captainView = ref(false)

  let rnd = prng_alea(gameKey.value)


  const connect = (username, room) => {
    server = broker(username)
    server.connect()

    channel = server.channels.get(`room${room}`)

    /*
    FIXME: this is for future members list
    channel.presence.subscribe('enter', (member) => {
      console.log(`${member.clientId} entered`)
    });
    */

    channel.presence.get((err, members) => {
      if (err != null) {
          console.error(err)
          return
      }
      console.info(`members: ${members.length}`)
      if (members.length == 0) {
        // assume this player is the first one
        const now = new Date().toJSON()
        gameKey.value = `${room}-${now}`
        console.info(`subscribed: ok (${gameKey.value})`)
        nextGame()
        channel.presence.enter()
        subscribed.value = true
      } else {
        // FIXME: race here if top ack client quit after ansering,
        // but that's ok for now
        // ask game state from a first presented player
        console.debug(`reqState(${members[0].clientId}): ->`)
        channel.publish('reqState', {
          from: server.options.clientId,
          to: members[0].clientId,
        })
      }
    });

    channel.subscribe(({name, data}) => {
      switch (name) {
        case 'open':
          console.debug(`open: <- (${data.idx})`)
          open(data.idx)
          break;
        case 'nextGame':
          console.debug(`nextGame: <- (${data.gameKey})`)
          if (data.gameKey != gameKey.value) {
            gameKey.value = data.gameKey
            rnd = prng_alea(gameKey.value)
            buildGame()
          }
          break;
        case 'reqState':
          if (data.to == server.options.clientId) {
            console.debug('reqState: <-')
            console.debug(`ackState(${data.from}): ->`)
            channel.publish('ackState', {
              gameKey: gameKey.value,
              state: board.value.map(c => ({state: c.state, word: c.word})),
              to: data.from,
            })
          }
          break;
        case 'ackState':
          if (data.to == server.options.clientId) {
            console.debug(`ackState: <-`)
            console.debug(data.gameKey)
            console.debug(data.state)
            if (data.gameKey != gameKey.value) {
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
            }
            console.info(`subscribed: ok ${gameKey.value}`)
            channel.presence.enter()
            subscribed.value = true
          }
      }
    })
  }

  const disconnect = () => {
    console.info('disconnect')
    channel.unsubscribe()
    server.channels.release()
    server.close()
  }

  const score = computed(() => {
    let score = {red: 0, blue: 0, gameOver: 'none'}
    if (!subscribed.value) {
      return score
    }
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
    rnd = prng_alea(gameKey.value)
    buildGame()
    if (subscribed.value) {
      channel.publish('nextGame', {gameKey: gameKey.value})
    }
  }

  const buildGame = () => {
    console.log(`new game ${gameKey.value}`)

    const cards = newCards(boardSize)
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
        word: 'колокольня',
        state: CardState.WhiteClosed,
        closed() { return this.state % 2 == 1 }
      }
    })
    gameKey.value = ''
    subscribed.value = false
    captainView.value = false
  }

  return { gameKey, score, captainView, subscribed,
    board, open, connect, disconnect, nextGame, $reset }
})
