import { beforeAll, beforeEach, it, describe, expect } from "vitest";
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
  });

  beforeEach(() => {
    store.$reset();
    store.setSeed("20241212212");
  });

  it("Doesn't repeat words for 46 turns", () => {
    let seen = [];
    for (let turn = 1; turn <= 46; turn++) {
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

  it("Counts score correctly", () => {
    const { redScore, blueScore } = storeToRefs(store);
    // black 20
    // reds  4 5 8 11 14 16 21 23
    // blues 3 6 7 9 15 19 24
    store.buildGame(1);
    expect(redScore.value).toEqual(8);
    expect(blueScore.value).toEqual(7);
    // open whites
    [0, 1, 2, 10].forEach((i) => store.open(i));
    expect(redScore.value).toEqual(8);
    expect(blueScore.value).toEqual(7);
    // open reds
    [4, 5, 8, 11].forEach((i) => store.open(i));
    // open blues
    [3, 6, 7].forEach((i) => store.open(i));
    expect(redScore.value).toEqual(4);
    expect(blueScore.value).toEqual(4);
    // open all reds
    [14, 16, 21, 23].forEach((i) => store.open(i));
    expect(redScore.value).toEqual(0);
    expect(blueScore.value).toEqual(4);
    // open all blues
    [9, 15, 19, 24].forEach((i) => store.open(i));
    expect(redScore.value).toEqual(0);
    expect(blueScore.value).toEqual(0);
  });

  it("Opens game over correctly", () => {
    const { gameOver } = storeToRefs(store);

    const cases = [
      { expected: "Both teams lost", cards: [20] },
      { expected: "Red team won", cards: [4, 5, 8, 11, 14, 16, 21, 23] },
      { expected: "Blue team won", cards: [3, 6, 7, 9, 15, 19, 24] },
    ];

    for (const { expected, cards } of cases) {
      store.$reset();
      store.setSeed("20241212212");
      store.buildGame(1);

      expect(gameOver.value).toBe("");

      cards.forEach((i) => store.open(i));
      expect(gameOver.value).toBe(expected);
    }
  });
});
