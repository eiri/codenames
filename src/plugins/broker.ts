import type { App, InjectionKey } from "vue";
import { useGameStore } from "@/stores/game";
import type { Captain } from "@/game/types";
import { usePlayersStore } from "@/stores/players";
import type { RoomAction } from "@/game/commands";
import { Transport } from "@/plugins/transport";

export const brokerKey: InjectionKey<Broker> = Symbol("broker");

export class Broker {
  gameStore = useGameStore();
  playersStore = usePlayersStore();

  constructor(private transport = new Transport()) {}

  connect(room: string, username: string) {
    this.gameStore.$reset();
    this.playersStore.$reset();
    this.playersStore.username = username;
    this.transport.connect(room, (reply) => {
      if (reply.snapshot.revision < this.gameStore.revision) return;
      this.gameStore.applySnapshot(reply.snapshot);
      this.playersStore.applySnapshot(reply.snapshot);
    }, (connected, pending, error) => {
      this.gameStore.connected = connected;
      this.gameStore.pending = pending;
      this.gameStore.error = error;
    });
  }

  private send(action: RoomAction) {
    if (this.gameStore.canMutate) {
      this.transport.send({ ...action, revision: this.gameStore.revision });
    }
  }

  open(idx: number) { this.send({ type: "open", idx }); }

  nextGame() { this.send({ type: "next" }); }
  newShuffle() { this.send({ type: "newShuffle" }); }
  nextCaptainsTurn() { this.send({ type: "advanceCaptains" }); }
  toggleCaptain() { this.send({ type: "toggleCaptain" }); }
  setCaptain(captain: Captain) { this.send({ type: "setCaptain", captain }); }

  disconnect() {
    this.transport.disconnect();
    this.gameStore.$reset();
    this.playersStore.$reset();
  }
}

export default {
  install(app: App) { app.provide(brokerKey, new Broker()); },
};
