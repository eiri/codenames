import { beforeAll, beforeEach, it, describe, expect } from "vitest";
import { createApp } from "vue";
import { setActivePinia, createPinia, storeToRefs } from "pinia";
import rnd from "@/plugins/rnd";
import dictionary from "@/assets/words.json";
import { useGameStore } from "@/stores/game";

type GameStore = ReturnType<typeof useGameStore>;

describe("Game Store", () => {
  const app = createApp({});
  let store: GameStore;

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
    const seen = [];
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
          445, 924, 1045, 604, 1127, 789, 741, 959, 356, 1005, 7, 303, 774, 651,
          255, 871, 342, 105, 152, 145, 386, 125, 528, 775, 687,
        ],
      },
      {
        turn: 3,
        expect: [
          511, 350, 556, 72, 1006, 1146, 93, 660, 116, 233, 640, 725, 971, 570,
          1038, 201, 259, 111, 235, 419, 811, 624, 474, 352, 794,
        ],
      },
      {
        turn: 2,
        expect: [
          995, 272, 855, 134, 1020, 1111, 762, 50, 502, 462, 881, 938, 878, 480,
          148, 1094, 849, 406, 1147, 128, 839, 745, 135, 1011, 584,
        ],
      },
    ]);
    testTable.forEach((test) => {
      store.buildGame(test.turn);
      expect(board.value).toHaveLength(test.expect.length);
      for (let i = 0; i < board.value.length; i++) {
        const j = test.expect[i];
        expect(board.value[i].word).toEqual(dictionary[j]);
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
