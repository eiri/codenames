import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Broker } from "./broker";
import type { Transport } from "./transport";
import type { RoomReply } from "@/game/snapshot";
import { roomSnapshot } from "@/test/fixtures";

let receive: (reply: RoomReply) => void;
let status: (connected: boolean, pending: boolean, error: string) => void;
const transport = {
  connect: vi.fn((_room: string, onReply: typeof receive, onStatus: typeof status) => {
    receive = onReply;
    status = onStatus;
  }),
  disconnect: vi.fn(),
  send: vi.fn(),
};
let broker: Broker;

beforeEach(() => {
  vi.clearAllMocks();
  setActivePinia(createPinia());
  broker = new Broker(transport as unknown as Transport);
  broker.connect("212", "Eiri");
});

describe("Broker", () => {
  it("applies server snapshots without reconstructing local game state", () => {
    const snapshot = roomSnapshot({ revision: 4, scores: { red: 5, blue: 6 } });
    receive({ snapshot });
    expect(broker.gameStore.board).toEqual(snapshot.board);
    expect(broker.gameStore.redScore).toBe(5);
    expect(broker.gameStore.blueScore).toBe(6);
    expect(broker.playersStore.username).toBe("Eiri");
    receive({ snapshot: roomSnapshot({ revision: 3 }) });
    expect(broker.gameStore.revision).toBe(4);
  });

  it("sends revision-based commands without optimistic changes", () => {
    receive({ snapshot: roomSnapshot({ revision: 7 }) });
    status(true, false, "");
    broker.open(2);
    expect(transport.send).toHaveBeenLastCalledWith({ type: "open", idx: 2, revision: 7 });
    expect(broker.gameStore.board[2].open).toBe(false);
    broker.setCaptain(2);
    expect(transport.send).toHaveBeenLastCalledWith({ type: "setCaptain", captain: 2, revision: 7 });
    expect(broker.playersStore.isCaptainView).toBe(false);
    broker.nextGame();
    expect(transport.send).toHaveBeenLastCalledWith({ type: "next", revision: 7 });
  });

  it("blocks pending or disconnected commands and preserves the last board", () => {
    receive({ snapshot: roomSnapshot({ revision: 2 }) });
    status(true, true, "");
    broker.newShuffle();
    status(false, false, "Disconnected");
    broker.nextGame();
    expect(transport.send).not.toHaveBeenCalled();
    expect(broker.gameStore.board).toHaveLength(25);
    broker.disconnect();
    expect(transport.disconnect).toHaveBeenCalled();
    expect(broker.gameStore.board).toHaveLength(0);
  });
});
