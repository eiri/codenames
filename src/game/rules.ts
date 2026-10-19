import { CardState, GameResult } from "./types";
import type { Card } from "./types";

export const boardSize = 25;
const red = Math.round((boardSize - 1) / 3);
const blue = red - 1;

export const isClosed = (card: Card) => card.state % 2 == 1;

export const hasOpenCards = (board: readonly Card[]) =>
  board.some((card) => !isClosed(card));

export const openCard = (board: Card[], idx: number) => {
  if (board[idx] && isClosed(board[idx])) board[idx].state -= 1;
};

export const scores = (board: readonly Card[]) => ({
  red: red - board.filter((card) => card.state == CardState.RedOpened).length,
  blue: blue - board.filter((card) => card.state == CardState.BlueOpened).length,
});

export const gameResult = (board: readonly Card[]): GameResult => {
  if (board.some((card) => card.state == CardState.BlackOpened))
    return GameResult.BothTeamsLost;

  const score = scores(board);
  if (score.red == 0) return GameResult.RedTeamWon;
  if (score.blue == 0) return GameResult.BlueTeamWon;
  return GameResult.InProgress;
};

