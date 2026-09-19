import type { RealtimeChannel } from "ably";
import type { App, InjectionKey } from "vue";

import { GameResult, useGameStore } from "@/stores/game";
import { Captain, usePlayersStore } from "@/stores/players";
import { gameMode, nextGame, roomSeed } from "@/plugins/game-flow";
import {
  ackStateMsg,
  indexMsg,
  nextGameMsg,
  playerMsg,
  playerName,
  stateReq,
  turnMsg,
} from "@/plugins/protocol";
import type { NewGameMode, NextGameMsg } from "@/plugins/protocol";
import { Transport } from "@/plugins/transport";

type GameStore = ReturnType<typeof useGameStore>;
type PlayersStore = ReturnType<typeof usePlayersStore>;

export const brokerKey: InjectionKey<Broker> = Symbol("broker");

export class Broker {
  private username = "";

  playersStore: PlayersStore;
  gameStore: GameStore;

  constructor(private transport = new Transport()) {
    this.playersStore = usePlayersStore();
    this.gameStore = useGameStore();
  }

  async connect() {
    const { channel, room, username } = await this.transport.connect();
    this.username = username;
    this.gameStore.setSeed(roomSeed(new Date(), room));
    this.playersStore.setPlayer(username);

    await this.subscribe(channel);
    await channel.publish("playerJoin", {
      player: username,
      captain: Captain.None,
    });
    await channel.publish("reqState", { from: username });
  }

  private async subscribe(channel: RealtimeChannel) {
    await channel.subscribe("playerJoin", ({ data }) => {
      const msg = playerMsg(data);
      if (!msg || msg.player == this.username) return;

      this.applyCaptain(msg.player, msg.captain, true);
    });

    await channel.subscribe("playerLeave", ({ data }) => {
      const player = playerName(data);
      if (!player || player == this.username) return;

      this.playersStore.removePlayer(player);
    });

    await channel.subscribe("setCaptain", ({ data }) => {
      const msg = playerMsg(data);
      if (!msg) return;

      this.applyCaptain(msg.player, msg.captain);
    });

    await channel.subscribe("open", ({ data }) => {
      const idx = indexMsg(data);
      if (idx == null) return;

      this.applyOpen(idx);
    });

    await channel.subscribe("setCaptainsTurn", ({ data }) => {
      const turn = turnMsg(data);
      if (turn == null) return;

      this.playersStore.setCaptainsTurn(turn);
    });

    await channel.subscribe("nextGame", ({ data }) => {
      const msg = nextGameMsg(data);
      if (!msg) return;

      this.applyNextGame(msg);
    });

    await channel.subscribe("globalLogout", () => {
      void this.disconnect();
      this.playersStore.logout();
    });

    await channel.subscribe("reqState", ({ data }) => {
      const from = stateReq(data);
      if (!from || from == this.username) return;

      channel.publish("ackState", [
        this.gameStore.getState(),
        this.playersStore.captainsTurn,
        this.playersStore.getPlayers(),
        from,
      ]);
    });

    await channel.subscribe("ackState", ({ data }) => {
      const state = ackStateMsg(data, this.username, this.gameStore.turn);
      if (!state) return;

      this.playersStore.$reset();
      this.playersStore.setPlayer(this.username);
      this.playersStore.newGame(state.captainTurn);
      for (const player of state.players) {
        this.playersStore.addPlayer(player.player, player.captain);
      }

      this.gameStore.buildGame(state.turn);
      this.gameStore.setState(state.state);
    });
  }

  private applyOpen(idx: number) {
    this.gameStore.open(idx);
  }

  private applyCaptain(player: string, captain: Captain, online = false) {
    if (online) this.playersStore.addPlayer(player, captain);
    else this.playersStore.setCaptain(player, captain);
  }

  private applyNextGame(msg: NextGameMsg) {
    const state = nextGame(
      this.gameStore.turn,
      this.playersStore.captainsTurn,
      msg.mode,
      msg.turn,
    );
    if (!state) return;

    this.playersStore.newGame(state.captainTurn);
    this.gameStore.buildGame(state.turn);
  }

  open(idx: number) {
    this.applyOpen(idx);
    this.transport.getChannel().publish("open", { idx });
  }

  nextGame(gameResult: GameResult) {
    const mode: NewGameMode = gameMode(gameResult);
    const msg = { mode, turn: this.gameStore.turn + 1 };
    this.applyNextGame(msg);
    this.transport.getChannel().publish("nextGame", msg);
  }

  nextCaptainsTurn() {
    const turn = this.playersStore.captainsTurn + 1;
    this.playersStore.setCaptainsTurn(turn);
    this.transport.getChannel().publish("setCaptainsTurn", { turn });
  }

  setCaptain(captain: Captain) {
    this.applyCaptain(this.username, captain);
    this.transport.getChannel().publish("setCaptain", {
      player: this.username,
      captain,
    });
  }

  globalLogout() {
    this.transport.getChannel().publish("globalLogout", null);
  }

  async disconnect() {
    await this.transport.disconnect(this.username);
    this.gameStore.$reset();
    this.playersStore.$reset();
  }
}

export default {
  install(app: App) {
    app.provide(brokerKey, new Broker());
  },
};
