import { beforeEach, it, describe, expect } from "vitest";
import { buildBoard, buildDeck } from "@/game/board";
import { gameResult, hasOpenCards, isClosed, openCard, scores } from "@/game/rules";
import { CardState, GameResult } from "@/game/types";
import type { Card } from "@/game/types";
import dictionary from "@/assets/words.json";

describe("Game rules", () => {
  let deck: Card[];
  let board: Card[];

  beforeEach(() => {
    deck = buildDeck();
    board = buildBoard(deck, 1);
  });

  it("Doesn't repeat words for 46 turns", () => {
    const seen = new Set<string>();
    for (let turn = 1; turn <= 46; turn++) {
      board = buildBoard(deck, turn);
      for (const card of board) {
        expect(seen.has(card.word)).toBe(false);
        seen.add(card.word);
      }
    }
  });

  it("Wraps after the last full round without changing the deck", () => {
    const firstRound = structuredClone(board);
    openCard(board, 0);
    board = buildBoard(deck, 47);

    expect(board).toStrictEqual(firstRound);
    expect(board.every(isClosed)).toBe(true);
  });

  it("Builds fresh decks with the same card distribution", () => {
    const fresh = buildDeck();
    expect(fresh).not.toStrictEqual(deck);
    for (let turn = 1; turn <= fresh.length / 25; turn++) {
      const cards = buildBoard(fresh, turn);
      for (const [state, count] of [
        [CardState.BlackClosed, 1], [CardState.RedClosed, 8],
        [CardState.BlueClosed, 7], [CardState.WhiteClosed, 9],
      ]) {
        expect(cards.filter((card) => card.state == state)).toHaveLength(count);
      }
    }
  });

  it("Preserves shuffled word order, offset, and limit", () => {
    const reverse = <T>(list: T[]) => { list.reverse(); };
    deck = buildDeck(reverse);
    const words = dictionary.slice().reverse();
    for (const turn of [1, 3, 2]) {
      board = buildBoard(deck, turn);
      expect(board.map((card) => card.word)).toEqual(words.slice((turn - 1) * 25, turn * 25));
      expect(board.map((card) => card.idx)).toEqual(Array.from({ length: 25 }, (_, idx) => idx));
    }
  });

  it("Opens a card only once and ignores invalid indexes", () => {
    expect(hasOpenCards(board)).toBe(false);
    const closedState = board[0].state;
    for (const idx of [-1, 25, 0.5, NaN]) openCard(board, idx);
    expect(hasOpenCards(board)).toBe(false);
    openCard(board, 0);
    openCard(board, 0);
    expect(board[0].state).toBe(closedState - 1);
    expect(hasOpenCards(board)).toBe(true);
  });

  it("Counts score correctly", () => {
    const reds = board.filter((card) => card.state == CardState.RedClosed);
    const blues = board.filter((card) => card.state == CardState.BlueClosed);
    expect(scores(board)).toEqual({ red: 8, blue: 7 });

    // Neutral cards do not affect either score.
    board.filter((card) => card.state == CardState.WhiteClosed)
      .forEach((card) => openCard(board, card.idx));
    expect(scores(board)).toEqual({ red: 8, blue: 7 });

    reds.slice(0, 4).forEach((card) => openCard(board, card.idx));
    blues.slice(0, 3).forEach((card) => openCard(board, card.idx));
    expect(scores(board)).toEqual({ red: 4, blue: 4 });
    reds.forEach((card) => openCard(board, card.idx));
    expect(scores(board)).toEqual({ red: 0, blue: 4 });
    blues.forEach((card) => openCard(board, card.idx));
    expect(scores(board)).toEqual({ red: 0, blue: 0 });
  });

  it("Calculates game results with the assassin taking precedence", () => {
    for (const [state, expected] of [
      [CardState.BlackClosed, GameResult.BothTeamsLost],
      [CardState.RedClosed, GameResult.RedTeamWon],
      [CardState.BlueClosed, GameResult.BlueTeamWon],
    ]) {
      board = buildBoard(deck, 1);
      expect(gameResult(board)).toBe(GameResult.InProgress);
      board.filter((card) => card.state == state).forEach((card) => openCard(board, card.idx));
      expect(gameResult(board)).toBe(expected);
      const assassin = board.find((card) => card.state == CardState.BlackClosed);
      if (assassin) openCard(board, assassin.idx);
      expect(gameResult(board)).toBe(GameResult.BothTeamsLost);
    }
  });
});
