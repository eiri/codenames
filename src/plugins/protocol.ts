import type { RoomReply } from "@/game/snapshot";

const object = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value == "object" && !Array.isArray(value);
const integer = (value: unknown): value is number =>
  Number.isSafeInteger(value) && (value as number) >= 0;

export const readReply = (data: unknown): RoomReply | null => {
  if (!object(data) || !object(data.snapshot)) return null;
  if (data.error !== undefined && typeof data.error != "string") return null;
  if (data.ack !== undefined && typeof data.ack != "boolean") return null;
  const snapshot = data.snapshot;
  if (!integer(snapshot.revision) || !integer(snapshot.round) || snapshot.round < 1 ||
    !integer(snapshot.captainTurn) || snapshot.captainTurn < 1 ||
    !object(snapshot.scores) || !integer(snapshot.scores.red) || !integer(snapshot.scores.blue) ||
    !integer(snapshot.result) || snapshot.result > 3 ||
    !Array.isArray(snapshot.captains) || snapshot.captains.length != 2 ||
    !snapshot.captains.every((name) => typeof name == "string") ||
    !Array.isArray(snapshot.board) || snapshot.board.length != 25 ||
    !Array.isArray(snapshot.players) || snapshot.players.length == 0) return null;

  const colors = ["black", "white", "red", "blue"];
  if (!snapshot.board.every((card, idx) =>
    object(card) && card.idx === idx && typeof card.word == "string" &&
    typeof card.open == "boolean" && (card.color === null || colors.includes(card.color as string)) &&
    (!card.open || card.color !== null))) return null;

  if (!snapshot.players.every((player) => object(player) &&
    ["username", "name", "lj", "avatar"].every((key) => typeof player[key] == "string") &&
    [0, 1, 2].includes(player.captain as number) &&
    typeof player.captainView == "boolean" && typeof player.online == "boolean")) return null;

  return data as unknown as RoomReply;
};
