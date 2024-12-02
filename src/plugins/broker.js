import { AES } from "crypto-es/lib/aes";
import { Utf8 } from "crypto-es/lib/core";
import Ably from "ably";

import { useGameStore } from "@/stores/game";
import { usePlayersStore } from "@/stores/players";

class Broker {
  #ably;
  #username;
  #syncLeader = null;
  constructor() {
    console.debug(`broker: init`);
    this.playersStore = usePlayersStore();
    this.gameStore = useGameStore();
    this.channel = null;
  }

  async setClient() {
    const password = localStorage.getItem("password");
    const decrypted = AES.decrypt(
      import.meta.env.VITE_KEY_CIPHERTEXT,
      password,
    );
    const ablyAPIKey = decrypted.toString(Utf8);
    console.assert(ablyAPIKey != "");

    this.#ably = new Ably.Realtime(ablyAPIKey);
    // debug logger
    this.#ably.connection.on((stateChange) => {
      console.debug(`broker: connection state ${JSON.stringify(stateChange)}`);
    });
    await this.#ably.connection.once("connected");
    console.log("broker: connected");
  }

  async connect() {
    console.debug(`broker: connect`);

    const room = localStorage.getItem("room");
    this.#username = localStorage.getItem("username");

    if (this.#username == null || room == null) {
      console.error(`missing username or room ${username} ${room}`);
      return;
    }

    await this.setClient();

    this.channel = this.#ably.channels.get(`room:${room}`);

    await this.channel.presence.subscribe(async (msg) => {
      console.debug(`broker: presence ${JSON.stringify(msg)}`);
      const members = await this.channel.presence.get();
      // console.debug(`broker: members`, members);
      this.playersStore.$reset();
      for (let i in members) {
        const { clientId: player } = members[i];
        this.playersStore.addPlayer(player);
        if (player != this.#username) {
          this.#syncLeader = player;
        }
      }
    });

    if (this.#syncLeader == null) {
      this.#syncLeader = this.#username;
    }

    // sync state
    await this.channel.presence.enterClient(this.#username);

    // set channel callbacks
    this.channel.subscribe("reqState", ({ data }) => {
      console.debug(
        `broker: received reqState ${JSON.stringify(data)} as ${this.#username}`,
      );
      if (data.to != this.#username) {
        return;
      }
      const payload = {
        state: this.gameStore.getState(),
        to: data.from,
      };
      console.debug(`broker: publish ackState ${JSON.stringify(payload)}`);
      this.channel.publish("ackState", payload);
    });

    this.channel.subscribe("ackState", ({ data }) => {
      console.debug(
        `broker: received ackState ${JSON.stringify(data)} as ${this.#username}`,
      );
      const {
        to,
        state: { key, state },
      } = data;
      if (to != this.#username) {
        return;
      }
      this.gameStore.setGameKey(key);
      this.gameStore.buildGame();
      this.gameStore.setState(state);
      console.debug(`broker: subscribed: ok (${key})`);
    });

    this.channel.subscribe("open", ({ data }) => {
      console.debug(
        `broker: received open ${JSON.stringify(data)} as ${this.#username}`,
      );
      const idx = data.idx;
      this.gameStore.open(idx);
    });

    // FIXME: it is possible to get same board in a single session
    // so better is to keep fixed sized table of unique words
    // to make sure there are at least N unique boards
    this.channel.subscribe("nextGame", ({ data }) => {
      console.debug(
        `broker: received nextGame ${JSON.stringify(data)} as ${this.#username}`,
      );
      this.gameStore.setGameKey(data.gameKey);
      this.gameStore.buildGame();
    });

    // sync state
    const payload = {
      from: this.#username,
      to: this.#syncLeader,
    };
    console.debug(`broker: publish reqState ${JSON.stringify(payload)}`);
    this.channel.publish("reqState", payload);
  }

  async disconnect() {
    console.debug(`broker: disconnect`);
    if (this.channel != null) {
      await this.channel.presence.unsubscribe();
      await this.channel.presence.leaveClient(this.#username);
      await this.channel.unsubscribe();
      await this.channel.detach();
      this.channel = null;
    }
    this.gameStore.$reset();
    this.playersStore.$reset();
    this.#ably.connection.off();
    this.#ably.close();
  }

  open(idx) {
    const payload = { idx };
    console.debug(`broker: publish open ${JSON.stringify(payload)}`);
    this.channel.publish("open", payload);
  }

  nextGame() {
    const payload = { gameKey: this.gameStore.nextWord() };
    console.debug(`broker: publish nextGame ${JSON.stringify(payload)}`);
    this.channel.publish("nextGame", payload);
  }
}

export default {
  install(app) {
    const broker = new Broker();
    app.provide("broker", broker);
  },
};
