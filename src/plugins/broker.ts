import { AES, Utf8 } from "crypto-es";
import { Realtime, RealtimeChannel, InboundMessage } from "ably";

import type { App, InjectionKey } from "vue";
import { GameResult, useGameStore } from "@/stores/game";
import { Captain, usePlayersStore } from "@/stores/players";

type GameStore = ReturnType<typeof useGameStore>;
type PlayersStore = ReturnType<typeof usePlayersStore>;
type NewGameMode = "next" | "restart";
type Data = Record<string, unknown>;

const isData = (data: unknown): data is Data =>
  typeof data == "object" && data != null;

const isCaptain = (captain: unknown): captain is Captain =>
  captain == Captain.None || captain == Captain.Red || captain == Captain.Blue;

export const brokerKey: InjectionKey<Broker> = Symbol("broker");

export class Broker {
  private client: Realtime | null = null;
  private username = "";
  private channel: RealtimeChannel | null = null;

  playersStore: PlayersStore;
  gameStore: GameStore;

  constructor() {
    console.debug(`broker: init`);
    this.playersStore = usePlayersStore();
    this.gameStore = useGameStore();
  }

  async setClient() {
    const username = sessionStorage.getItem("username");
    const password = sessionStorage.getItem("password");
    if (username == null || password == null) {
      throw new Error("Missing username or password");
    }
    const decrypted = AES.decrypt(
      import.meta.env.VITE_KEY_CIPHERTEXT,
      password,
    );
    const ablyAPIKey = decrypted.toString(Utf8);
    if (ablyAPIKey == "") {
      throw new Error("Invalid API Key");
    }

    const client = new Realtime({ key: ablyAPIKey, clientId: username });
    await client.connection.once("connected");
    this.client = client;
    this.username = username;
    console.log("broker: connected");

    return client;
  }

  async connect() {
    console.debug(`broker: connect`);

    const room = sessionStorage.getItem("room");
    if (room == null) {
      throw new Error("Missing room");
    }

    const client = await this.setClient();
    const now = new Date();
    const seed =
      now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, "0") +
      now.getDate().toString().padStart(2, "0") +
      room;
    this.gameStore.setSeed(seed);
    this.playersStore.setPlayer(this.username);

    const channelName = `room:${room}`;
    const channel = client.channels.get(channelName);
    this.channel = channel;

    await channel.subscribe("playerJoin", ({ data }) => {
      if (!isData(data)) return;
      const { player, captain } = data;
      if (typeof player != "string" || !isCaptain(captain)) return;
      if (player === this.username) return;
      console.debug(`broker: received playerJoin ${player}`);
      this.playersStore.addPlayer(player, captain);
    });

    await channel.subscribe("playerLeave", ({ data }) => {
      if (!isData(data) || typeof data.player != "string") return;
      const { player } = data;
      if (player === this.username) return;
      console.debug(`broker: received playerLeave ${player}`);
      this.playersStore.removePlayer(player);
    });

    await channel.subscribe("setCaptain", ({ data }) => {
      if (!isData(data)) return;
      const { player, captain } = data;
      if (typeof player != "string" || !isCaptain(captain)) return;
      console.debug(`broker: received setCaptain ${player} -> ${captain}`);
      this.playersStore.setCaptain(player, captain);
    });

    await channel.subscribe("open", ({ data }) => {
      if (!isData(data) || !Number.isInteger(data.idx)) return;
      const idx = data.idx as number;
      console.debug(`broker: received open ${idx} as ${this.username}`);
      this.gameStore.open(idx);
    });

    await channel.subscribe("setCaptainsTurn", ({ data }) => {
      if (!isData(data) || !Number.isInteger(data.turn)) return;
      const turn = data.turn as number;
      console.debug(`broker: received setCaptainsTurn ${turn}`);
      this.playersStore.setCaptainsTurn(turn);
    });

    await channel.subscribe("nextGame", ({ data }) => {
      if (!isData(data)) return;
      const { mode, turn } = data;
      if (
        (mode != "next" && mode != "restart") ||
        !Number.isInteger(turn) ||
        (turn as number) <= this.gameStore.turn
      )
        return;

      console.debug(
        `broker: received nextGame as ${this.username} with mode ${mode}`,
      );
      const nextCaptainTurn =
        mode == "next"
          ? this.playersStore.captainsTurn + 1
          : this.playersStore.captainsTurn;
      this.playersStore.newGame(nextCaptainTurn);
      this.gameStore.buildGame(turn as number);
    });

    await channel.subscribe("globalLogout", () => {
      console.debug(`broker: received globalLogout as ${this.username}`);
      this.disconnect();
      this.playersStore.logout();
    });

    // Peers respond with state; the joining client keeps the newest reply.
    const onReqState = ({ data }: InboundMessage) => {
      if (!isData(data) || typeof data.from != "string") return;
      const { from } = data;
      // Don't respond to our own broadcast (we're the one joining)
      if (from === this.username) return;
      console.debug(
        `broker: received reqState from ${from}, publishing ackState`,
      );
      const state = this.gameStore.getState();
      const captainTurn = this.playersStore.captainsTurn;
      const players = this.playersStore.getPlayers();
      // FIXME! ok, this is a hack. what I really need to do here is to create a new store for bout (or turn) state
      // and move all state of turn, captains, desk state, game result in there, so two other stores will be just
      // "tables" generated from init seed and out store/turn will pull data from there
      // and manage cursor (aka turn, catainTurn) on there
      console.debug(
        `broker: publish ackState ${JSON.stringify(state)} captainTurn: ${captainTurn} players: ${JSON.stringify(players)}`,
      );
      channel.publish("ackState", [state, captainTurn, players, from]);
    };
    await channel.subscribe("reqState", onReqState);

    const onAckState = (msg: InboundMessage) => {
      if (!Array.isArray(msg.data) || !isData(msg.data[0])) return;
      const { turn, state } = msg.data[0];
      const captainTurn = msg.data[1];
      const players = msg.data[2] ?? [];
      const to = msg.data[3];
      if (
        to !== this.username ||
        !Number.isInteger(turn) ||
        (turn as number) < this.gameStore.turn ||
        !Array.isArray(state) ||
        !state.every(Number.isInteger) ||
        !Number.isInteger(captainTurn) ||
        !Array.isArray(players)
      )
        return;

      const validPlayers = players.filter(
        (p): p is { player: string; captain: Captain } =>
          isData(p) && typeof p.player == "string" && isCaptain(p.captain),
      );
      console.debug(
        `broker: received ackState for turn ${turn} state ${state} captainTurn: ${captainTurn} players: ${JSON.stringify(players)}`,
      );

      this.playersStore.$reset();
      this.playersStore.setPlayer(this.username);
      this.playersStore.newGame(captainTurn as number);
      for (const { player, captain } of validPlayers) {
        this.playersStore.addPlayer(player, captain);
      }

      this.gameStore.buildGame(turn as number);
      this.gameStore.setState(state as number[]);
    };
    await channel.subscribe("ackState", onAckState);

    console.debug(`broker: publish playerJoin + reqState`);
    await channel.publish("playerJoin", {
      player: this.username,
      captain: Captain.None,
    });
    await channel.publish("reqState", { from: this.username });
  }

  private getChannel() {
    if (!this.channel) throw new Error("Broker is not connected");

    return this.channel;
  }

  open(idx: number) {
    console.debug(`broker: publish open ${idx}`);
    this.gameStore.open(idx);
    this.getChannel().publish("open", { idx });
  }

  nextGame(gameResult: GameResult) {
    const mode: NewGameMode =
      gameResult == GameResult.RedTeamWon ||
      gameResult == GameResult.BlueTeamWon
        ? "next"
        : "restart";
    console.debug(`broker: send nextGame with mode ${mode}`);
    this.getChannel().publish("nextGame", {
      mode,
      turn: this.gameStore.turn + 1,
    });
  }

  nextCaptainsTurn() {
    const turn = this.playersStore.captainsTurn + 1;
    console.debug(`broker: send setCaptainsTurn ${turn}`);
    this.playersStore.setCaptainsTurn(turn);
    this.getChannel().publish("setCaptainsTurn", { turn });
  }

  setCaptain(captain: Captain) {
    console.debug(`broker: send setCaptain ${captain}`);
    this.playersStore.setCaptain(this.username, captain);
    this.getChannel().publish("setCaptain", {
      player: this.username,
      captain,
    });
  }

  globalLogout() {
    console.debug("broker: send globalLogout");
    this.getChannel().publish("globalLogout", null);
  }

  async disconnect() {
    console.debug(`broker: disconnect`);

    const channel = this.channel;
    const client = this.client;
    this.channel = null;
    this.client = null;

    if (channel) {
      try {
        await channel.publish("playerLeave", { player: this.username });
      } catch (error) {
        console.warn("broker: failed to publish playerLeave", error);
      }

      channel.unsubscribe();
      try {
        await channel.detach();
      } catch (error) {
        console.warn("broker: failed to detach", error);
      }
    }

    this.gameStore.$reset();
    this.playersStore.$reset();

    if (client) {
      client.connection.off();
      client.close();
    }
  }
}

export default {
  install(app: App) {
    const broker = new Broker();
    app.provide(brokerKey, broker);
  },
};
