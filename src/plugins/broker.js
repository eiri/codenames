import { AES } from "crypto-es/lib/aes";
import { Utf8 } from "crypto-es/lib/core";
import { Realtime } from "ably";

import { useGameStore } from "@/stores/game";
import { usePlayersStore } from "@/stores/players";

class Broker {
  #client;
  #username;
  #syncLeader = null;
  constructor() {
    console.debug(`broker: init`);
    this.playersStore = usePlayersStore();
    this.gameStore = useGameStore();
    this.channel = null;
    this.reqStateChannel = null;
  }

  async setClient() {
    const password = localStorage.getItem("password");
    const decrypted = AES.decrypt(
      import.meta.env.VITE_KEY_CIPHERTEXT,
      password,
    );
    const ablyAPIKey = decrypted.toString(Utf8);
    if (ablyAPIKey == "") {
      throw new Error("Invalid API Key");
    }

    this.#client = new Realtime(ablyAPIKey);
    await this.#client.connection.once("connected");
    console.log("broker: connected");
  }

  async connect() {
    console.debug(`broker: connect`);

    const room = localStorage.getItem("room");

    this.#syncLeader = null;
    this.#username = localStorage.getItem("username");

    if (this.#username == null || room == null) {
      throw new Error("Missing username or room");
    }

    this.#syncLeader = this.#username;
    this.playersStore.setPlayer(this.#username);

    await this.setClient();

    const channelName = `room:${room}`;
    this.channel = this.#client.channels.get(channelName);

    await this.channel.presence.subscribe(
      "enter",
      async ({ clientId: player }) => {
        console.debug(`broker: presence enter ${player}`);
        this.playersStore.addPlayer(player, { isCaptain: false });
      },
    );

    await this.channel.presence.subscribe(
      "leave",
      async ({ clientId: player }) => {
        console.debug(`broker: presence leave ${player}`);
        this.playersStore.removePlayer(player);
      },
    );

    await this.channel.presence.subscribe("update", async (msg) => {
      console.debug(`broker: presence update ${JSON.stringify(msg)}`);
      const {
        clientId: player,
        data: { isCaptain },
      } = msg;
      this.playersStore.setCaptain(player, isCaptain);
      if (player == this.#username) {
        this.gameStore.isCaptainView = isCaptain;
      }
    });

    const members = await this.channel.presence.get();
    console.debug(`broker: sync members (${members.length})`);
    this.playersStore.$reset();
    this.playersStore.setPlayer(this.#username);
    for (let i in members) {
      const { clientId: player, data } = members[i];
      this.playersStore.addPlayer(player, data);
      if (player != this.#username) {
        this.#syncLeader = player;
      }
    }

    await this.channel.presence.enterClient(this.#username);

    // callbacks
    await this.channel.subscribe("open", ({ data: idx }) => {
      console.debug(`broker: received open ${idx} as ${this.#username}`);
      this.gameStore.open(idx);
    });

    // FIXME: it is possible to get same board in a single session
    // so better is to keep fixed sized table of unique words
    // to make sure there are at least N unique boards
    await this.channel.subscribe("nextGame", () => {
      console.debug(`broker: received nextGame as ${this.#username}`);
      this.playersStore.newGame();
      this.gameStore.buildGame(null);
    });

    // sync state
    this.reqStateChannel = this.#client.channels.getDerived(channelName, {
      filter:
        'name == `"reqState"` && headers.to == `"' + this.#username + '"`',
    });
    const onReqState = () => {
      console.debug(`broker: received reqState`);
      const state = this.gameStore.getState();
      console.debug(`broker: publish ackState ${JSON.stringify(state)}`);
      this.channel.publish("ackState", state);
    };
    await this.reqStateChannel.subscribe(onReqState);

    // receive once
    const onAckState = ({ data: { key, state } }) => {
      console.debug(`broker: received ackState with key ${key} state ${state}`);
      this.gameStore.buildGame(key);
      this.gameStore.setState(state);
      this.channel.unsubscribe("ackState");
    };
    this.channel.subscribe("ackState", onAckState);

    console.debug(`broker: publish reqState`);
    this.channel.publish({
      name: "reqState",
      extras: {
        headers: {
          from: this.#username,
          to: this.#syncLeader,
        },
      },
    });
  }

  open(idx) {
    console.debug(`broker: publish open ${idx}`);
    this.channel.publish("open", idx);
  }

  nextGame() {
    console.debug(`broker: send nextGame`);
    this.channel.publish("nextGame", null);
  }

  toggleCaptain(isCaptain) {
    console.debug(`broker: send toggleCaptain ${isCaptain}`);
    this.channel.presence.updateClient(this.#username, { isCaptain });
  }

  async disconnect() {
    console.debug(`broker: disconnect`);
    await this.channel.presence.unsubscribe();
    await this.channel.presence.leaveClient(this.#username);

    await this.reqStateChannel.unsubscribe();
    await this.reqStateChannel.detach();
    this.reqStateChannel = null;

    await this.channel.unsubscribe();
    await this.channel.detach();
    this.channel = null;

    this.gameStore.$reset();
    this.playersStore.$reset();

    this.#client.connection.off();
    this.#client.close();
  }
}

export default {
  install(app) {
    const broker = new Broker();
    app.provide("broker", broker);
  },
};
