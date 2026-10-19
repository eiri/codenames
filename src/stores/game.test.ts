import { beforeEach, it, describe, expect } from "vitest";
import { buildBoard, buildDeck } from "@/game/board";
import { gameResult, hasOpenCards, isClosed, openCard, scores } from "@/game/rules";
import { GameResult } from "@/game/types";
import type { Card } from "@/game/types";
import dictionary from "@/assets/words.json";

describe("Game rules", () => {
  let deck: Card[];
  let board: Card[];

  beforeEach(() => {
    deck = buildDeck("20241212212");
    board = buildBoard(deck, 1);
  });

  it("Doesn't repeat words for 46 turns", () => {
    const seen = [];
    for (let turn = 1; turn <= 46; turn++) {
      board = buildBoard(deck, turn);
      for (const card of board) {
        expect(seen).not.toContain(card.word);
        seen.push(card.word);
      }
    }
  });

  it("Wraps after the last full round", () => {
    board = buildBoard(deck, 1);
    const firstRound = board.map((card) => card.word);
    openCard(board, 0);

    board = buildBoard(deck, 47);

    expect(board.map((card) => card.word)).toStrictEqual(firstRound);
    expect(board.every((card) => isClosed(card))).toBe(true);
  });

  it("Rebuilds the deck when the seed changes", () => {
    const original = buildBoard(deck, 2);
    deck = buildDeck("another-seed");
    const rebuilt = buildBoard(deck, 2);

    expect(rebuilt).not.toStrictEqual(original);
    expect(buildBoard(buildDeck("another-seed"), 2)).toStrictEqual(rebuilt);
  });

  it("Has expectred words, offset and limit when shuffled", () => {
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
      board = buildBoard(deck, test.turn);
      expect(board).toHaveLength(test.expect.length);
      for (let i = 0; i < board.length; i++) {
        const j = test.expect[i];
        expect(board[i].word).toEqual(dictionary[j]);
      }
    });
  });

  it("Tracks whether cards are open", () => {
    expect(hasOpenCards(board)).toBe(false);

    openCard(board, 0);

    expect(hasOpenCards(board)).toBe(true);
  });

  it("Counts score correctly", () => {
    // black 11
    // reds  2 6 8 9 17 19 20 21
    // blues 10 12 13 16 22 23 24
    board = buildBoard(deck, 1);
    expect(scores(board).red).toEqual(8);
    expect(scores(board).blue).toEqual(7);
    // open whites
    [0, 1, 3, 4].forEach((i) => openCard(board, i));
    expect(scores(board).red).toEqual(8);
    expect(scores(board).blue).toEqual(7);
    // open reds
    [2, 6, 8, 9].forEach((i) => openCard(board, i));
    // open blues
    [10, 12, 13].forEach((i) => openCard(board, i));
    expect(scores(board).red).toEqual(4);
    expect(scores(board).blue).toEqual(4);
    // open all reds
    [17, 19, 20, 21].forEach((i) => openCard(board, i));
    expect(scores(board).red).toEqual(0);
    expect(scores(board).blue).toEqual(4);
    // open all blues
    [16, 22, 23, 24].forEach((i) => openCard(board, i));
    expect(scores(board).red).toEqual(0);
    expect(scores(board).blue).toEqual(0);
  });

  it("Opens game over correctly", () => {
    const cases = [
      { expected: GameResult.BothTeamsLost, cards: [11] },
      { expected: GameResult.RedTeamWon, cards: [2, 6, 8, 9, 17, 19, 20, 21] },
      { expected: GameResult.BlueTeamWon, cards: [10, 12, 13, 16, 22, 23, 24] },
    ];

    for (const { expected, cards } of cases) {
      board = buildBoard(deck, 1);

      expect(gameResult(board)).toBe(GameResult.InProgress);

      cards.forEach((i) => openCard(board, i));
      expect(gameResult(board)).toBe(expected);
    }
  });
});
