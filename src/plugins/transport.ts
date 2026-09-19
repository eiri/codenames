import { AES, Utf8 } from "crypto-es";
import { Realtime, RealtimeChannel } from "ably";

interface Connection {
  channel: RealtimeChannel;
  room: string;
  username: string;
}

export class Transport {
  private client: Realtime | null = null;
  private channel: RealtimeChannel | null = null;

  async connect(): Promise<Connection> {
    const username = sessionStorage.getItem("username");
    const password = sessionStorage.getItem("password");
    const room = sessionStorage.getItem("room");
    if (username == null || password == null) {
      throw new Error("Missing username or password");
    }
    if (room == null) throw new Error("Missing room");

    const decrypted = AES.decrypt(
      import.meta.env.VITE_KEY_CIPHERTEXT,
      password,
    );
    const key = decrypted.toString(Utf8);
    if (key == "") throw new Error("Invalid API Key");

    const client = new Realtime({ key, clientId: username });
    await client.connection.once("connected");

    const channel = client.channels.get(`room:${room}`);
    this.client = client;
    this.channel = channel;

    return { channel, room, username };
  }

  getChannel() {
    if (!this.channel) throw new Error("Broker is not connected");

    return this.channel;
  }

  async disconnect(username: string) {
    const channel = this.channel;
    const client = this.client;
    this.channel = null;
    this.client = null;

    if (channel) {
      try {
        await channel.publish("playerLeave", { player: username });
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

    if (client) {
      client.connection.off();
      client.close();
    }
  }
}
