import { GameResult } from "@/stores/game";
import type { NewGameMode } from "@/plugins/protocol";

interface NextGame {
  captainTurn: number;
  turn: number;
}

export const gameMode = (result: GameResult): NewGameMode =>
  result == GameResult.RedTeamWon || result == GameResult.BlueTeamWon
    ? "next"
    : "restart";

export const nextGame = (
  currentTurn: number,
  captainTurn: number,
  mode: NewGameMode,
  turn: number,
): NextGame | null => {
  if (turn <= currentTurn) return null;

  return {
    turn,
    captainTurn: mode == "next" ? captainTurn + 1 : captainTurn,
  };
};

export const roomSeed = (date: Date, room: string) =>
  date.getFullYear().toString() +
  (date.getMonth() + 1).toString().padStart(2, "0") +
  date.getDate().toString().padStart(2, "0") +
  room;
