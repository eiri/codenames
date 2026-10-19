import type { App, InjectionKey } from "vue";
import { createRandom } from "@/game/random";

export type Rnd = ReturnType<typeof createRandom>;
export const rndKey: InjectionKey<Rnd> = Symbol("rnd");

export const uuidv4 = (): string => {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => {
    const random = crypto.getRandomValues(new Uint8Array(1))[0];
    return (Number(c) ^ (random & (15 >> (Number(c) / 4)))).toString(16);
  });
};

export default {
  install(app: App) {
    app.provide(rndKey, createRandom(uuidv4()));
  },
};
