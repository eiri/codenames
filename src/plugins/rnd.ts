import { App } from "vue";
import prng_alea from "esm-seedrandom/esm/alea";

export const uuidv4 = (): string => {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => {
    const random = crypto.getRandomValues(new Uint8Array(1))[0];
    return (Number(c) ^ (random & (15 >> (Number(c) / 4)))).toString(16);
  });
};

export class Rnd {
  private prng: { quick: () => number };

  constructor(seed: string) {
    this.prng = prng_alea(seed);
  }

  mash(seed: string) {
    this.prng = prng_alea(seed);
  }

  next(): number {
    return this.prng.quick();
  }
}

export default {
  install(app: App) {
    const uuid = uuidv4();
    const rnd = new Rnd(uuid);
    app.provide("rnd", rnd);
  },
};
