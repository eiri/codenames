import type { Captain } from "./types";

export type RoomAction =
  | { type: "open"; idx: number }
  | { type: "toggleCaptain" }
  | { type: "setCaptain"; captain: Captain }
  | { type: "advanceCaptains" }
  | { type: "restart" }
  | { type: "next" }
  | { type: "newShuffle" };

export type RoomCommand = RoomAction & { revision: number };
