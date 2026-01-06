import { AES, Utf8 } from "crypto-es";
import {
  Realtime,
  RealtimeChannel,
  PresenceMessage,
  messageCallback,
  InboundMessage,
} from "ably";

import type { App, InjectionKey } from "vue";
import { useGameStore } from "@/stores/game";
import { Captain, usePlayersStore } from "@/stores/players";

type GameStore = ReturnType<typeof useGameStore>;
type PlayersStore = ReturnType<typeof usePlayersStore>;

interface AckStateMessage extends InboundMessage {
  data: {
    turn: number;
    state: number[];
  };
}

export const brokerKey: InjectionKey<Broker> = Symbol("broker");

export class Broker {
  private client: Realtime;
  private username: string;
  private syncLeader: string = null;

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
    const username = localStorage.getItem("username");
    const password = localStorage.getItem("password");
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

    const room = localStorage.getItem("room");
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

    await this.channel.presence.subscribe(
      "enter",
      async ({ clientId: player }) => {
        console.debug(`broker: presence enter ${player}`);
        this.playersStore.addPlayer(player, Captain.None);
      },
    );

    await this.channel.presence.subscribe(
      "leave",
      async ({ clientId: player }) => {
        console.debug(`broker: presence leave ${player}`);
        this.playersStore.removePlayer(player);
      },
    );

    await this.channel.presence.subscribe(
      "update",
      async (msg: PresenceMessage) => {
        console.debug(`broker: presence update ${JSON.stringify(msg)}`);
        const {
          clientId: player,
          data: { captain },
        } = msg;
        this.playersStore.setCaptain(player, captain);
      },
    );

    this.syncLeader = this.username;
    const members = await this.channel.presence.get();
    console.debug(`broker: sync members (${members.length})`);
    this.playersStore.$reset();
    this.playersStore.setPlayer(this.username);
    for (const i in members) {
      const {
        clientId: player,
        data: { captain } = { captain: Captain.None },
      } = members[i];
      this.playersStore.addPlayer(player, captain);
      if (player != this.username) {
        this.syncLeader = player;
      }
    }

    await this.channel.presence.enter();

    // callbacks
    await this.channel.subscribe("open", ({ data: { idx } }) => {
      console.debug(`broker: received open ${idx} as ${this.username}`);
      this.gameStore.open(idx);
    });

    await this.channel.subscribe("nextGame", () => {
      console.debug(`broker: received nextGame as ${this.username}`);
      this.playersStore.newGame();
      this.gameStore.buildGame(this.gameStore.turn + 1);
    });

    await this.channel.subscribe("globalLogout", () => {
      console.debug(`broker: received globalLogout as ${this.username}`);
      this.disconnect();
      this.playersStore.logout();
    });

    // sync state
    this.reqStateChannel = this.client.channels.getDerived(channelName, {
      filter: 'name == `"reqState"` && headers.to == `"' + this.username + '"`',
    });
    const onReqState = () => {
      console.debug(`broker: received reqState`);
      const state = this.gameStore.getState();
      console.debug(`broker: publish ackState ${JSON.stringify(state)}`);
      this.channel.publish("ackState", state);
    };
    await this.reqStateChannel.subscribe(onReqState);

    // receive once
    const onAckState: messageCallback<AckStateMessage> = (msg) => {
      const { turn, state } = msg.data;
      console.debug(
        `broker: received ackState for turn ${turn} state ${state}`,
      );
      this.gameStore.buildGame(turn);
      this.gameStore.setState(state);
      this.channel.unsubscribe("ackState");
    };
    this.channel.subscribe("ackState", onAckState);

    console.debug(`broker: publish reqState`);
    this.channel.publish({
      name: "reqState",
      extras: {
        headers: {
          from: this.username,
          to: this.syncLeader,
        },
      },
    });
  }

  open(idx: number) {
    console.debug(`broker: publish open ${idx}`);
    this.gameStore.open(idx);
    this.channel.publish("open", { idx });
  }

  nextGame() {
    console.debug(`broker: send nextGame`);
    this.channel.publish("nextGame", null);
  }

  setCaptain(captain: Captain) {
    console.debug(`broker: send setCaptain ${captain}`);
    this.playersStore.setCaptain(this.username, captain);
    this.channel.presence.update({ captain });
  }

  globalLogout() {
    console.debug("broker: send globalLogout");
    this.channel.publish("globalLogout", null);
  }

  async disconnect() {
    console.debug(`broker: disconnect`);
    this.channel.presence.unsubscribe();
    await this.channel.presence.leave();

    this.reqStateChannel.unsubscribe();
    await this.reqStateChannel.detach();
    this.reqStateChannel = null;

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
