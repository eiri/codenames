import { AES } from "crypto-es/lib/aes";
import { Utf8 } from "crypto-es/lib/core";
import Ably from "ably";

import { usePlayersStore } from "@/stores/players";

class Broker {
  #ably;
  #syncLeader = null;
  constructor() {
    console.debug(`broker: init`);
    this.playersStore = usePlayersStore();
    this.channel = null;
  }

  get syncLeader() {
    return this.#syncLeader;
  }

  async connect(username, password, room) {
    console.debug(`broker: connect`);
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

    this.channel = this.#ably.channels.get(`room:${room}`);

    await this.channel.presence.subscribe(async (msg) => {
      console.debug(`broker: presence ${JSON.stringify(msg)}`);
      const members = await this.channel.presence.get();
      // console.debug(`broker: members`, members);
      this.playersStore.$reset();
      for (let i in members) {
        const { clientId: player } = members[i];
        this.playersStore.addPlayer(player);
        if (player != username) {
          this.#syncLeader = player;
        }
      }
    });

    await this.channel.presence.enterClient(username);
  }

  async disconnect(username) {
    console.debug(`broker: disconnect`);
    if (this.channel != null) {
      await this.channel.presence.unsubscribe();
      await this.channel.presence.leaveClient(username);
      await this.channel.unsubscribe();
      await this.channel.detach();
      this.channel = null;
    }
    this.#ably.connection.off();
    this.#ably.close();
  }
}

export default {
  install(app) {
    const broker = new Broker();
    app.provide("broker", broker);
  },
};
