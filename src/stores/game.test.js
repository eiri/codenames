import { beforeAll, beforeEach, afterAll, describe, it, expect, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGameStore } from '@/stores/game.js'

vi.mock('ably', () => {
  let callbacks = {}
  const Realtime = vi.fn()
  Realtime.prototype.connect = vi.fn()
  Realtime.prototype.connection = {
    on: (name, fn) => {
      // call func to register all callbacks
      if (name === "connected") {
        fn()
      }
    }
  }
  Realtime.prototype.channels = {
    get: vi.fn(() => {
      return {
        subscribe: (name, fn) => {
          callbacks[name] = fn
        },
        publish: (name, payload) => {
          callbacks[name]({data : payload})
        },
        presence: {
          subscribe: vi.fn(),
          get: vi.fn(),
        }
      }
    })
  }
  return {
    default: { Realtime }
  }
})

describe('Game Store', () => {
  beforeAll(async () => {
    localStorage.setItem("password", "fakefake")
    localStorage.setItem("username", "test")
    localStorage.setItem("room", "test")
    vi.spyOn(console, "assert").mockImplementation(() => {})
    vi.spyOn(console, "debug").mockImplementation(() => {})
  })

  beforeEach(async () => {
    setActivePinia(createPinia())
  })

  afterAll(() => {
    vi.restoreAllMocks()
  })

  it("Doesn't repeat words", () => {
    const store = useGameStore()

    const connectSpy = vi.spyOn(store, 'connect')
    store.connect()
    expect(connectSpy).toHaveBeenCalledTimes(1)

    let seen = []
    // 43 is total number of games before seen exhausted
    for (let i = 1; i <= 43; i++) {
      store.nextGame()
      for (const card of store.board) {
        expect(seen).not.toContain(card.word)
        seen.push(card.word)
      }
    }
  })
})
