import type { Captain, GameResult } from "./types";
import type { RosterEntry } from "./roster";

export type CardColor = "black" | "white" | "red" | "blue";

export interface CardSnapshot {
  idx: number;
  word: string;
  open: boolean;
  color: CardColor | null;
}

export interface RoomSnapshot {
  revision: number;
  round: number;
  board: CardSnapshot[];
  scores: { red: number; blue: number };
  result: GameResult;
  captainTurn: number;
  captains: [string, string];
  players: (RosterEntry & { username: string; captain: Captain; captainView: boolean; online: boolean })[];
}

export interface RoomReply {
  snapshot: RoomSnapshot;
  error?: string;
  ack?: boolean;
}
