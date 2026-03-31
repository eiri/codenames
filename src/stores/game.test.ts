import { beforeAll, beforeEach, it, describe, expect } from "vitest";
import { createApp } from "vue";
import { setActivePinia, createPinia, storeToRefs } from "pinia";
import rnd from "@/plugins/rnd";
import dictionary from "@/assets/words.json";
import { GameResult, useGameStore } from "@/stores/game";

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
          400, 1071, 606, 130, 642, 45, 1069, 1105, 132, 653, 815, 889, 866,
          972, 117, 229, 515, 1007, 1046, 528, 720, 152, 65, 517, 901,
        ],
      },
      {
        turn: 3,
        expect: [
          774, 103, 1114, 173, 133, 437, 432, 468, 358, 250, 13, 885, 974, 323,
          193, 1028, 785, 431, 1144, 579, 470, 523, 714, 368, 502,
        ],
      },
      {
        turn: 2,
        expect: [
          17, 639, 1126, 227, 1038, 347, 656, 338, 428, 118, 620, 525, 1089,
          661, 604, 709, 1051, 473, 902, 201, 170, 609, 686, 961, 233,
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
    // black 11
    // reds  2 6 8 9 17 19 20 21
    // blues 10 12 13 16 22 23 24
    store.buildGame(1);
    expect(redScore.value).toEqual(8);
    expect(blueScore.value).toEqual(7);
    // open whites
    [0, 1, 3, 4].forEach((i) => store.open(i));
    expect(redScore.value).toEqual(8);
    expect(blueScore.value).toEqual(7);
    // open reds
    [2, 6, 8, 9].forEach((i) => store.open(i));
    // open blues
    [10, 12, 13].forEach((i) => store.open(i));
    expect(redScore.value).toEqual(4);
    expect(blueScore.value).toEqual(4);
    // open all reds
    [17, 19, 20, 21].forEach((i) => store.open(i));
    expect(redScore.value).toEqual(0);
    expect(blueScore.value).toEqual(4);
    // open all blues
    [16, 22, 23, 24].forEach((i) => store.open(i));
    expect(redScore.value).toEqual(0);
    expect(blueScore.value).toEqual(0);
  });

  it("Opens game over correctly", () => {
    const { gameOver } = storeToRefs(store);

    const cases = [
      { expected: GameResult.BothTeamsLost, cards: [11] },
      { expected: GameResult.RedTeamWon, cards: [2, 6, 8, 9, 17, 19, 20, 21] },
      { expected: GameResult.BlueTeamWon, cards: [10, 12, 13, 16, 22, 23, 24] },
    ];

    for (const { expected, cards } of cases) {
      store.$reset();
      store.setSeed("20241212212");
      store.buildGame(1);

      expect(gameOver.value).toBe(GameResult.InProgress);

      cards.forEach((i) => store.open(i));
      expect(gameOver.value).toBe(expected);
    }
  });
});
