import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useGameStore } from "@/stores/game.js";

vi.mock("ably", () => {
  let data = {};
  const Realtime = vi.fn();
  Realtime.prototype.connect = vi.fn();
  Realtime.prototype.connection = {
    on: (name, fn) => {
      if (name === "connected") {
        fn();
      }
    },
  };
  Realtime.prototype.channels = {
    get: vi.fn(() => {
      return {
        publish: (name, payload) => {
          data = payload;
        },
        presence: {
          subscribe: vi.fn(),
          get: vi.fn(),
        },
        subscribe: (name, fn) => {
          if (name === "nextGame") {
            fn({ data });
          }
        },
      };
    }),
  };
  return {
    default: { Realtime },
  };
});

describe("Game Store", () => {
  beforeAll(async () => {
    localStorage.setItem("password", "fakefake");
    localStorage.setItem("username", "test");
    localStorage.setItem("room", "test");
    vi.spyOn(console, "assert").mockImplementation(() => {});
    vi.spyOn(console, "debug").mockImplementation(() => {});
    setActivePinia(createPinia());
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("Doesn't repeat words", () => {
    const store = useGameStore();

    const connectSpy = vi.spyOn(store, "connect");
    store.connect();
    expect(connectSpy).toHaveBeenCalledTimes(1);

    for (let i = 1; i <= 12; i++) {
      store.nextGame();
      let seen = [];
      for (const card of store.board) {
        expect(seen).not.toContain(card.word);
        seen.push(card.word);
      }
    }
  });
});
