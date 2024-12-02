import { beforeEach, it, describe, expect } from "vitest";
import { createApp } from "vue";
import { setActivePinia, createPinia } from "pinia";
import rnd from "@/plugins/rnd";
import { useGameStore } from "@/stores/game.js";

describe("Game Store", () => {
  const app = createApp({});

  beforeEach(() => {
    const pinia = createPinia();
    app.use(rnd);
    app.use(pinia);
    setActivePinia(pinia);
  });

  it("Doesn't repeat words", () => {
    const store = useGameStore();
    for (let i = 1; i <= 12; i++) {
      store.buildGame();
      let seen = [];
      for (const card of store.board) {
        expect(seen).not.toContain(card.word);
        seen.push(card.word);
      }
    }
  });
});
