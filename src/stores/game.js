import Ably from 'ably'

import { prng_alea } from 'esm-seedrandom';
import { ref, computed, inject } from 'vue'
import { defineStore } from 'pinia'

import { words } from '../assets/words'
import { CardState } from '../assets/states'

export const useGameStore = defineStore('game', () => {
  const boardSize = 25
  // https://colorkit.co/palette/ffadad-ffd6a5-fdffb6-caffbf-9bf6ff-a0c4ff-bdb2ff-ffc6ff/
  const palette = ["#ffadad","#ffd6a5","#fdffb6","#caffbf","#9bf6ff","#a0c4ff","#bdb2ff","#ffc6ff"]
  // from https://stackoverflow.com/questions/18638900/javascript-crc32
  const crc32=function(r){for(var a,o=[],c=0;c<256;c++){a=c;for(var f=0;f<8;f++)a=1&a?3988292384^a>>>1:a>>>1;o[c]=a}for(var n=-1,t=0;t<r.length;t++)n=n>>>8^o[255&(n^r.charCodeAt(t))];return(-1^n)>>>0};

  const board = ref(Array(boardSize).fill().map(() => {
    return {
      word: '',
      state: CardState.WhiteOpened,
      closed() { return this.state % 2 == 1 }
    }
  }))

  //FIXME throw error if any of those are empty strings/undefined
  const username = ref(localStorage.getItem("username"))
  const room = ref(localStorage.getItem("room"))

  const players = ref({})
  const captainView = ref(false)

  const gameKey = ref(self.crypto.randomUUID())
  let rnd = prng_alea(gameKey.value)

  const broker = inject('broker')
  let channel = broker.channels.get(`room${room.value}`)

  const connect = () => {
    console.debug('connect')
    username.value = localStorage.getItem("username")
    broker.connect()
  }

  broker.connection.on((stateChange) => {
    console.debug(`connection state ${JSON.stringify(stateChange)}`)
  })

  const disconnect = () => {
    console.debug('disconnect')
    channel.presence.leaveClient(username.value)
    broker.close()
  }

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
        channel.presence.enterClient(username.value)
      } else {
        // FIXME: race here if top ack client quit after ansering,
        // but that's ok for now
        // ask game state from a first presented player
        for (let i in members) {
          const player = members[i].clientId
          const playerData = {
            name: player,
            short: player[0],
            color: palette[crc32(player) % palette.length],
            captain: false,
            team: 'white',
          }
          players.value[player] = playerData
          if (i == 0) {
            const payload = {
              from: username.value,
              to: player,
            }
            console.debug(`publish reqState ${JSON.stringify(payload)}`)
            channel.publish('reqState', payload)
          }
        }
      }
    })
  }

  broker.connection.on('connected', syncState)

  channel.presence.subscribe('enter', (member) => {
    console.debug(`presence enter member ${JSON.stringify(member)}`)
    const player = member.clientId
    const playerData = {
      name: player,
      short: player[0],
      color: palette[crc32(player) % palette.length],
      captain: false,
      team: 'white',
    }
    players.value[player] = playerData
  })

  channel.presence.subscribe('leave', (member) => {
    console.debug(`presence leave member ${JSON.stringify(member)}`)
    delete players.value[member.clientId]
  })

  channel.subscribe('reqState', ({data}) => {
    console.debug(`received reqState ${JSON.stringify(data)} as ${username.value}`)
    if (data.to != username.value) {
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
    console.debug(`received ackState ${JSON.stringify(data)} as ${username.value}`)
    if (data.to != username.value || data.gameKey == gameKey.value) {
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
    channel.presence.enterClient(username.value)
  })

  const open = (idx) => {
    if (board.value[idx] && board.value[idx].closed()) {
      const payload = { idx }
      console.debug(`publish open ${JSON.stringify(payload)}`)
      channel.publish('open', payload)
    }
  }

  channel.subscribe('open', ({data}) => {
    console.debug(`received open ${JSON.stringify(data)} as ${username.value}`)
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
    console.debug(`received nextGame ${JSON.stringify(data)} as ${username.value}`)
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
    gameKey.value = ''
    username.value = ''
    // room.value = ''
    players.value = {}
    captainView.value = false
    board.value = Array(boardSize).fill().map(() => {
      return {
        word: '',
        state: CardState.WhiteOpened,
        closed() { return this.state % 2 == 1 }
      }
    })
  }

  return {
    gameKey,
    username,
    room,
    players,
    captainView,
    board,
    open,
    connect,
    disconnect,
    nextGame,
    $reset
  }
})
