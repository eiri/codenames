import { beforeAll, it, describe, expect } from "vitest";
import { createApp } from "vue";
import { setActivePinia, createPinia, storeToRefs } from "pinia";
import rnd from "@/plugins/rnd";
import dictionary from "@/assets/words.json";
import { useGameStore } from "@/stores/game.js";

describe("Game Store", () => {
  const app = createApp({});
  let store;

  beforeAll(() => {
    const pinia = createPinia();
    app.use(rnd);
    app.use(pinia);
    setActivePinia(pinia);
    store = useGameStore();
    store.setSeed("20241212212");
  });

  it("Doesn't repeat words for 45 turns", () => {
    let seen = [];
    for (let turn = 1; turn <= 45; turn++) {
      store.buildGame(turn);
      for (const card of store.board) {
        expect(seen).not.toContain(card.word);
        seen.push(card.word);
      }
    }
  });

  it("Has expectred words, offset and limit when shuffled", () => {
    const { board } = storeToRefs(store);
    const testTable = new Set([
      {
        turn: 1,
        expect: [
          939, 177, 599, 394, 1043, 416, 1020, 1025, 842, 822, 993, 508, 901,
          859, 225, 1037, 92, 746, 71, 236, 882, 789, 817, 648, 690,
        ],
      },
      {
        turn: 3,
        expect: [
          656, 912, 37, 1062, 364, 161, 318, 148, 382, 81, 716, 976, 91, 140,
          755, 349, 455, 600, 733, 97, 396, 507, 372, 978, 437,
        ],
      },
      {
        turn: 2,
        expect: [
          77, 520, 123, 567, 527, 221, 264, 184, 737, 305, 147, 707, 688, 846,
          239, 934, 863, 127, 141, 671, 1016, 839, 1051, 661, 462,
        ],
      },
    ]);
    testTable.forEach((test) => {
      store.buildGame(test.turn);
      expect(board.value).toHaveLength(test.expect.length);
      for (let i = 0; i < board.length; i++) {
        const j = test.expect[i];
        expect(board.value[i]).toEqual(dictionary[j]);
      }
    });
  });
});
