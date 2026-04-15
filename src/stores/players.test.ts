import { beforeAll, beforeEach, it, describe, expect } from "vitest";
import { createApp } from "vue";
import { setActivePinia, createPinia } from "pinia";
import rnd from "@/plugins/rnd";
import { Captain, usePlayersStore } from "./players";

type PlayersStore = ReturnType<typeof usePlayersStore>;

describe("Game Store", () => {
  const app = createApp({});
  let store: PlayersStore;

  beforeAll(() => {
    const pinia = createPinia();
    app.use(rnd);
    app.use(pinia);
    setActivePinia(pinia);
    store = usePlayersStore();
  });

  it("Doesn't repeat captain pairs for 5 turns", () => {
    const seed = "20241212212";
    const seen = [];
    for (let turn = 1; turn <= 5; turn++) {
      const pair = store.nextCaptains(seed, turn);
      expect(seen).not.toContain(pair.join(":"));
      seen.push(pair.join(":"));
    }
    // consistent rand
    expect(seen).toStrictEqual([
      "Friday:Eiri",
      "Vitaliy:Akari",
      "Ikadell:Friday",
      "Eiri:Vitaliy",
      "Akari:Ikadell",
    ]);
  });

  describe("getPlayers", () => {
    beforeEach(() => {
      store.$reset();
    });

    it("returns empty array when no players are online", () => {
      expect(store.getPlayers()).toStrictEqual([]);
    });

    it("returns only online players", () => {
      store.addPlayer("Akari", Captain.None);
      store.addPlayer("Eiri", Captain.None);

      const result = store.getPlayers();
      expect(result).toHaveLength(2);
      expect(result).toContainEqual({ player: "Akari", captain: Captain.None });
      expect(result).toContainEqual({ player: "Eiri", captain: Captain.None });
    });

    it("excludes players who have left", () => {
      store.addPlayer("Akari", Captain.None);
      store.addPlayer("Eiri", Captain.None);
      store.removePlayer("Eiri");

      const result = store.getPlayers();
      expect(result).toHaveLength(1);
      expect(result).toContainEqual({ player: "Akari", captain: Captain.None });
    });

    it("reflects current captain assignments", () => {
      store.addPlayer("Akari", Captain.None);
      store.addPlayer("Eiri", Captain.None);
      store.setCaptain("Akari", Captain.Red);
      store.setCaptain("Eiri", Captain.Blue);

      const result = store.getPlayers();
      expect(result).toContainEqual({ player: "Akari", captain: Captain.Red });
      expect(result).toContainEqual({ player: "Eiri", captain: Captain.Blue });
    });

    it("reflects captain set at join time", () => {
      store.addPlayer("Friday", Captain.Red);

      const result = store.getPlayers();
      expect(result).toContainEqual({ player: "Friday", captain: Captain.Red });
    });

    it("includes self wth just setPlayer", () => {
      store.setPlayer("Akari");

      const result = store.getPlayers();
      expect(result).toContainEqual({ player: "Akari", captain: Captain.None });
    });

    it("returns empty array after $reset", () => {
      store.addPlayer("Akari", Captain.Red);
      store.$reset();

      expect(store.getPlayers()).toStrictEqual([]);
    });
  });
});
