import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";
import { usePlayersStore } from "./players";
import { nextCaptains } from "@/game/captains";
import { roomSnapshot } from "@/test/fixtures";

beforeEach(() => setActivePinia(createPinia()));

describe("Players", () => {
  it("does not repeat captain pairs for five turns", () => {
    const order = ["Friday", "Eiri", "Vitaliy", "Akari", "Ikadell"];
    const pairs = Array.from({ length: 5 }, (_, idx) => nextCaptains(order, idx + 1).join(":"));
    expect(pairs).toEqual(["Friday:Eiri", "Vitaliy:Akari", "Ikadell:Friday", "Eiri:Vitaliy", "Akari:Ikadell"]);
  });

  it("uses server-provided roles, presence, roster order, and suggestions", () => {
    const store = usePlayersStore();
    store.username = "Eiri";
    const snapshot = roomSnapshot();
    snapshot.players.reverse();
    const me = snapshot.players.find((player) => player.username == "Eiri")!;
    me.captainView = true;
    me.captain = 2;
    store.applySnapshot(snapshot);
    expect(Object.keys(store.players)).toEqual(snapshot.players.map((player) => player.username));
    expect(store.isCaptainView).toBe(true);
    expect(store.isRedCaptain).toBe(false);
    expect(store.isBlueCaptain).toBe(true);
    expect(store.players.Eiri.online).toBe(false);
    expect(store.captains).toEqual(snapshot.captains);
    store.applySnapshot({ ...snapshot, captainTurn: 2 });
    expect(store.isCaptainView).toBe(true);
    store.$reset();
    expect(store.isCaptainView).toBe(false);
  });
});
