import { Captain } from "@/stores/players";

export type NewGameMode = "next" | "restart";
export interface PlayerMsg {
  player: string;
  captain: Captain;
}
export interface NextGameMsg {
  mode: NewGameMode;
  turn: number;
}
export interface AckStateMsg {
  turn: number;
  state: number[];
  captainTurn: number;
  players: PlayerMsg[];
}

type Data = Record<string, unknown>;

const isData = (data: unknown): data is Data =>
  typeof data == "object" && data != null;

const isInt = (value: unknown): value is number => Number.isInteger(value);

const isCaptain = (captain: unknown): captain is Captain =>
  captain == Captain.None || captain == Captain.Red || captain == Captain.Blue;

const isMode = (mode: unknown): mode is NewGameMode =>
  mode == "next" || mode == "restart";

export const playerMsg = (data: unknown): PlayerMsg | null => {
  if (!isData(data)) return null;
  const { player, captain } = data;
  if (typeof player != "string" || !isCaptain(captain)) return null;

  return { player, captain };
};

export const playerName = (data: unknown): string | null =>
  isData(data) && typeof data.player == "string" ? data.player : null;

export const indexMsg = (data: unknown): number | null =>
  isData(data) && isInt(data.idx) ? data.idx : null;

export const turnMsg = (data: unknown): number | null =>
  isData(data) && isInt(data.turn) && data.turn > 0 ? data.turn : null;

export const nextGameMsg = (data: unknown): NextGameMsg | null => {
  if (!isData(data) || !isInt(data.turn) || !isMode(data.mode)) return null;

  return { mode: data.mode, turn: data.turn };
};

export const stateReq = (data: unknown): string | null =>
  isData(data) && typeof data.from == "string" ? data.from : null;

export const ackStateMsg = (
  data: unknown,
  username: string,
  currentTurn: number,
): AckStateMsg | null => {
  if (!Array.isArray(data) || !isData(data[0])) return null;

  const { turn, state } = data[0];
  const captainTurn = data[1];
  const players = data[2] ?? [];
  const to = data[3];
  if (
    to !== username ||
    !isInt(turn) ||
    turn < currentTurn ||
    !Array.isArray(state) ||
    !state.every(isInt) ||
    !isInt(captainTurn) ||
    !Array.isArray(players)
  )
    return null;

  return {
    turn,
    state,
    captainTurn,
    players: players.map(playerMsg).filter((p) => p != null),
  };
};
