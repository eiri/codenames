import { AES, Utf8 } from "crypto-es";
import { Realtime, RealtimeChannel, InboundMessage } from "ably";

import type { App, InjectionKey } from "vue";
import { GameResult, useGameStore } from "@/stores/game";
import { Captain, usePlayersStore } from "@/stores/players";

type GameStore = ReturnType<typeof useGameStore>;
type PlayersStore = ReturnType<typeof usePlayersStore>;

export const brokerKey: InjectionKey<Broker> = Symbol("broker");

const HEARTBEAT_INTERVAL = 5_000;
const HEARTBEAT_TIMEOUT = 16_000;

export class Broker {
  private client: Realtime;
  private username: string;

  private _heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private _peerTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  playersStore: PlayersStore;
  gameStore: GameStore;
  channel: RealtimeChannel = null;
  reqStateChannel: RealtimeChannel = null;

  constructor() {
    console.debug(`broker: init`);
    this.playersStore = usePlayersStore();
    this.gameStore = useGameStore();
    this.channel = null;
    this.reqStateChannel = null;
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

    this.client = new Realtime({ key: ablyAPIKey, clientId: username });
    await this.client.connection.once("connected");
    this.username = username;
    console.log("broker: connected");
  }

  async connect() {
    console.debug(`broker: connect`);

    const room = sessionStorage.getItem("room");
    if (room == null) {
      throw new Error("Missing room");
    }

    await this.setClient();
    const now = new Date();
    const seed =
      now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, "0") +
      now.getDate().toString().padStart(2, "0") +
      room;
    this.gameStore.setSeed(seed);
    this.playersStore.setPlayer(this.username);

    const channelName = `room:${room}`;
    this.channel = this.client.channels.get(channelName);

    await this.channel.subscribe(
      "playerJoin",
      ({ data: { player, captain } }) => {
        if (player === this.username) return;
        console.debug(`broker: received playerJoin ${player}`);
        this.playersStore.addPlayer(player, captain);
        this._resetPeerTimer(player);
      },
    );

    await this.channel.subscribe("playerLeave", ({ data: { player } }) => {
      if (player === this.username) return;
      console.debug(`broker: received playerLeave ${player}`);
      this.playersStore.removePlayer(player);
      this._clearPeerTimer(player);
    });

    await this.channel.subscribe(
      "setCaptain",
      ({ data: { player, captain } }) => {
        console.debug(`broker: received setCaptain ${player} -> ${captain}`);
        this.playersStore.setCaptain(player, captain);
      },
    );

    await this.channel.subscribe("open", ({ data: { idx } }) => {
      console.debug(`broker: received open ${idx} as ${this.username}`);
      this.gameStore.open(idx);
    });

    await this.channel.subscribe("nextGame", ({ data: { gameResult } }) => {
      console.debug(
        `broker: received nextGame as ${this.username} with game result ${gameResult}`,
      );
      if (
        gameResult == GameResult.InProgress ||
        gameResult == GameResult.BothTeamsLost
      ) {
        this.playersStore.newGame(this.playersStore.captainsTurn);
      } else {
        this.playersStore.newGame(this.playersStore.captainsTurn + 1);
      }
      this.gameStore.buildGame(this.gameStore.turn + 1);
    });

    await this.channel.subscribe("globalLogout", () => {
      console.debug(`broker: received globalLogout as ${this.username}`);
      this.disconnect();
      this.playersStore.logout();
    });

    // Any connected peer that receives reqState responds with full state.
    // The joining client takes the first ackState reply and ignores the rest.
    const onReqState = ({ data: { from } }: InboundMessage) => {
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
      this.channel.publish("ackState", [state, captainTurn, players]);
    };
    await this.channel.subscribe("reqState", onReqState);

    const onAckState = (msg: InboundMessage) => {
      if (!msg.data) return;
      const { turn, state } = msg.data[0] as { turn: number; state: number[] };
      const captainTurn = msg.data[1];
      const players: { player: string; captain: Captain }[] = msg.data[2] ?? [];
      console.debug(
        `broker: received ackState for turn ${turn} state ${state} captainTurn: ${captainTurn} players: ${JSON.stringify(players)}`,
      );

      this.playersStore.$reset();
      this.playersStore.setPlayer(this.username);
      this.playersStore.newGame(captainTurn);
      for (const { player, captain } of players) {
        this.playersStore.addPlayer(player, captain);
        if (player !== this.username) this._resetPeerTimer(player);
      }

      this.gameStore.buildGame(turn);
      this.gameStore.setState(state);

      // Unsubscribe after first reply — ignore any subsequent ackState messages
      this.channel.unsubscribe("ackState");
    };
    await this.channel.subscribe("ackState", onAckState);

    // Reset eviction timer for any peer we hear a heartbeat from
    await this.channel.subscribe("heartbeat", ({ data: { player } }) => {
      if (player === this.username) return;
      console.debug(`broker: received heartbeat from ${player}`);
      this._resetPeerTimer(player);
    });

    console.debug(`broker: publish playerJoin + reqState`);
    await this.channel.publish("playerJoin", {
      player: this.username,
      captain: Captain.None,
    });
    await this.channel.publish("reqState", { from: this.username });

    this._heartbeatTimer = setInterval(() => {
      this.channel.publish("heartbeat", { player: this.username });
    }, HEARTBEAT_INTERVAL);
  }

  private _resetPeerTimer(player: string) {
    this._clearPeerTimer(player);
    const timer = setTimeout(() => {
      console.debug(`broker: ${player} timed out, evicting`);
      this.playersStore.removePlayer(player);
      this._peerTimers.delete(player);
    }, HEARTBEAT_TIMEOUT);
    this._peerTimers.set(player, timer);
  }

  private _clearPeerTimer(player: string) {
    const existing = this._peerTimers.get(player);
    if (existing) {
      clearTimeout(existing);
      this._peerTimers.delete(player);
    }
  }

  open(idx: number) {
    console.debug(`broker: publish open ${idx}`);
    this.gameStore.open(idx);
    this.channel.publish("open", { idx });
  }

  nextGame(gameResult: GameResult) {
    console.debug(`broker: send nextGame`);
    this.channel.publish("nextGame", { gameResult });
  }

  setCaptain(captain: Captain) {
    console.debug(`broker: send setCaptain ${captain}`);
    this.playersStore.setCaptain(this.username, captain);
    this.channel.publish("setCaptain", { player: this.username, captain });
  }

  globalLogout() {
    console.debug("broker: send globalLogout");
    this.channel.publish("globalLogout", null);
  }

  async disconnect() {
    console.debug(`broker: disconnect`);

    if (this._heartbeatTimer) {
      clearInterval(this._heartbeatTimer);
      this._heartbeatTimer = null;
    }

    for (const timer of this._peerTimers.values()) {
      clearTimeout(timer);
    }
    this._peerTimers.clear();

    await this.channel.publish("playerLeave", { player: this.username });

    this.channel.unsubscribe();
    await this.channel.detach();
    this.channel = null;

    this.gameStore.$reset();
    this.playersStore.$reset();

    this.client.connection.off();
    this.client.close();
  }
}

export default {
  install(app: App) {
    const broker = new Broker();
    app.provide(brokerKey, broker);
  },
};
