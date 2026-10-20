import type { RoomSnapshot } from "@/game/snapshot";
import { roster } from "@/game/roster";
import { GameResult } from "@/game/types";

export const roomSnapshot = (overrides: Partial<RoomSnapshot> = {}): RoomSnapshot => ({
  revision: 0,
  round: 1,
  board: Array.from({ length: 25 }, (_, idx) => ({ idx, word: `word-${idx}`, open: false, color: null })),
  scores: { red: 8, blue: 7 },
  result: GameResult.InProgress,
  captainTurn: 1,
  captains: ["Akari", "Eiri"],
  players: Object.entries(roster).map(([username, entry]) => ({
    ...entry, username, captain: 0, captainView: false, online: false,
  })),
  ...overrides,
});
