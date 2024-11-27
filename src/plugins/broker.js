import { AES } from "crypto-es/lib/aes";
import { Utf8 } from "crypto-es/lib/core";
import Ably from "ably";

class Broker {
  #ably;
  constructor() {
    console.debug(`broker: init`);
    this.channel = null;
  }

  connect(username, password, room, cb) {
    console.debug(`broker: connect`);
    const decrypted = AES.decrypt(
      import.meta.env.VITE_KEY_CIPHERTEXT,
      password,
    );
    const ablyAPIKey = decrypted.toString(Utf8);
    console.assert(ablyAPIKey != "");

    this.#ably = new Ably.Realtime({
      key: ablyAPIKey,
      autoConnect: false,
      transportParams: { heartbeatInterval: 300000 },
    });

    // debug logger
    this.#ably.connection.on((stateChange) => {
      console.debug(`broker: connection state ${JSON.stringify(stateChange)}`);
    });

    this.channel = this.#ably.channels.get(`room-${room}`);

    this.#ably.connection.on("connected", cb);

    this.#ably.connect();
  }

  disconnect() {
    console.debug(`broker: disconnect`);
    this.channel.presence.unsubscribe();
    this.channel.unsubscribe();
    this.channel.detach();
    this.#ably.connection.off();
    this.#ably.close();
    this.channel = null;
  }
}

export default {
  install(app) {
    const broker = new Broker();
    app.provide("broker", broker);
  },
};
