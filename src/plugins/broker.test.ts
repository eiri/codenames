import { createApp } from "vue";
import { createPinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import rnd from "@/plugins/rnd";

const fakes = vi.hoisted(() => {
  type Handler = (message: { data: unknown }) => void | Promise<void>;
  const rooms = new Map<string, Set<FakeChannel>>();
  let decryptedKey = "key";

  class FakeChannel {
    handlers = new Map<string, Set<Handler>>();

    constructor(private name: string) {
      const channels = rooms.get(name) ?? new Set();
      channels.add(this);
      rooms.set(name, channels);
    }

    async subscribe(event: string, handler: Handler) {
      const handlers = this.handlers.get(event) ?? new Set();
      handlers.add(handler);
      this.handlers.set(event, handlers);
    }

    async publish(event: string, data: unknown) {
      const tasks = [...(rooms.get(this.name) ?? [])].flatMap((channel) =>
        [...(channel.handlers.get(event) ?? [])].map((handler) =>
          Promise.resolve().then(() => handler({ data })),
        ),
      );
      await Promise.all(tasks);
    }

    unsubscribe(event?: string) {
      if (event) this.handlers.delete(event);
      else this.handlers.clear();
    }

    async detach() {
      rooms.get(this.name)?.delete(this);
    }
  }

  class Realtime {
    connection = {
      once: vi.fn().mockResolvedValue(undefined),
      off: vi.fn(),
    };
    channels = {
      get: (name: string) => new FakeChannel(name),
    };
    close = vi.fn();

    constructor() {}
  }

  return {
    Realtime,
    rooms,
    reset() {
      rooms.clear();
      decryptedKey = "key";
    },
    setKey(key: string) {
      decryptedKey = key;
    },
    decrypt() {
      return { toString: () => decryptedKey };
    },
    async publish(room: string, event: string, data: unknown) {
      const channel = new FakeChannel(room);
      await channel.publish(event, data);
      await channel.detach();
    },
  };
});

vi.mock("ably", () => ({ Realtime: fakes.Realtime }));
vi.mock("crypto-es", () => ({
  AES: { decrypt: fakes.decrypt },
  Utf8: {},
}));

import { Broker } from "@/plugins/broker";
import { Captain } from "@/stores/players";

const makeBroker = () => {
  const app = createApp({});
  const pinia = createPinia();
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/", component: { template: "<div />" } }],
  });
  app.use(router);
  app.use(pinia);
  app.use(rnd);

  return app.runWithContext(() => new Broker());
};

const connectAs = (broker: Broker, username: string) => {
  sessionStorage.setItem("username", username);
  sessionStorage.setItem("password", "password");
  sessionStorage.setItem("room", "212");

  return broker.connect();
};

describe("Broker", () => {
  beforeEach(() => {
    sessionStorage.clear();
    fakes.reset();
  });

  it("rejects failed authentication", async () => {
    const broker = makeBroker();
    fakes.setKey("");

    await expect(connectAs(broker, "Akari")).rejects.toThrow("Invalid API Key");
  });

  it("connects two clients and synchronizes players", async () => {
    const akari = makeBroker();
    const eiri = makeBroker();

    const first = connectAs(akari, "Akari");
    const second = connectAs(eiri, "Eiri");
    await Promise.all([first, second]);

    expect(akari.playersStore.players.Eiri.online).toBe(true);
    expect(eiri.playersStore.players.Akari.online).toBe(true);
    expect(eiri.gameStore.board).toStrictEqual(akari.gameStore.board);
  });

  it("synchronizes concurrent card opens and captain changes", async () => {
    const akari = makeBroker();
    const eiri = makeBroker();
    await connectAs(akari, "Akari");
    await connectAs(eiri, "Eiri");

    akari.open(0);
    eiri.open(1);
    akari.setCaptain(Captain.Red);
    akari.nextCaptainsTurn();
    await vi.waitFor(() => {
      expect(eiri.gameStore.board[0].closed()).toBe(false);
      expect(akari.gameStore.board[1].closed()).toBe(false);
      expect(eiri.playersStore.players.Akari.captain).toBe(Captain.Red);
      expect(eiri.playersStore.captainsTurn).toBe(2);
    });
  });

  it("applies a concurrent new-game event once", async () => {
    const broker = makeBroker();
    await connectAs(broker, "Akari");

    await Promise.all([
      fakes.publish("room:212", "nextGame", { mode: "restart", turn: 2 }),
      fakes.publish("room:212", "nextGame", { mode: "restart", turn: 2 }),
    ]);

    expect(broker.gameStore.turn).toBe(2);
  });

  it("ignores stale peer state", async () => {
    const broker = makeBroker();
    await connectAs(broker, "Akari");
    await fakes.publish("room:212", "nextGame", {
      mode: "restart",
      turn: 2,
    });

    await fakes.publish("room:212", "ackState", [
      { turn: 1, state: broker.gameStore.getState().state },
      1,
      [],
      "Akari",
    ]);

    expect(broker.gameStore.turn).toBe(2);
  });

  it("ignores malformed events and unknown players", async () => {
    const broker = makeBroker();
    await connectAs(broker, "Akari");

    await expect(
      Promise.all([
        fakes.publish("room:212", "playerJoin", null),
        fakes.publish("room:212", "playerJoin", {
          player: "Unknown",
          captain: Captain.Red,
        }),
        fakes.publish("room:212", "open", { idx: "bad" }),
        fakes.publish("room:212", "nextGame", { mode: "bad", turn: 2 }),
        fakes.publish("room:212", "ackState", [null]),
      ]),
    ).resolves.toBeDefined();

    expect(broker.gameStore.turn).toBe(1);
    expect(broker.playersStore.getPlayers()).toHaveLength(1);
  });

  it("disconnects safely and can reconnect", async () => {
    const broker = makeBroker();
    await connectAs(broker, "Akari");
    await broker.disconnect();
    await broker.disconnect();

    expect(broker.gameStore.board).toHaveLength(0);
    expect(broker.playersStore.getPlayers()).toHaveLength(0);

    await connectAs(broker, "Akari");
    expect(broker.gameStore.board).toHaveLength(25);
  });
});
