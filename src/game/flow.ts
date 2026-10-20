import { GameResult } from "./types";

export const nextCaptainTurn = (turn: number, result: GameResult): number =>
  result == GameResult.RedTeamWon || result == GameResult.BlueTeamWon ? turn + 1 : turn;
