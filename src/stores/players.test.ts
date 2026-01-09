import { beforeAll, it, describe, expect } from "vitest";
import { createApp } from "vue";
import { setActivePinia, createPinia } from "pinia";
import rnd from "@/plugins/rnd";
import { usePlayersStore } from "./players";

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

  it("Doesn't repeat captain pairs for 10 turns", () => {
    const seed = "20241212212";
    const seen = [];
    for (let turn = 1; turn <= 20; turn++) {
      const pair = store.nextCaptains(seed, turn);
      expect(seen).not.toContain(pair.join(":"));
      seen.push(pair.join(":"));
    }
    // consistent rand
    expect(seen).toStrictEqual([
      "Eiri:Ikadell",
      "Akari:Friday",
      "Vitaliy:Eiri",
      "Ikadell:Friday",
      "Akari:Vitaliy",
      "Ikadell:Vitaliy",
      "Eiri:Friday",
      "Ikadell:Akari",
      "Vitaliy:Friday",
      "Akari:Ikadell",
      "Friday:Vitaliy",
      "Friday:Akari",
      "Ikadell:Eiri",
      "Vitaliy:Akari",
      "Friday:Ikadell",
      "Eiri:Vitaliy",
      "Friday:Eiri",
      "Vitaliy:Ikadell",
      "Akari:Eiri",
      "Eiri:Akari",
    ]);
  });
});
