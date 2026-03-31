import { App, InjectionKey } from "vue";

export const rndKey: InjectionKey<Rnd> = Symbol("rnd");

export const uuidv4 = (): string => {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => {
    const random = crypto.getRandomValues(new Uint8Array(1))[0];
    return (Number(c) ^ (random & (15 >> (Number(c) / 4)))).toString(16);
  });
};

function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFromString(seed: string): number {
  let h = 0x12345678;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 0x9e3779b9);
    h ^= h >>> 16;
  }
  return h >>> 0;
}

export class Rnd {
  private prng: () => number;

  constructor(seed: string) {
    this.prng = mulberry32(seedFromString(seed));
  }

  mash(seed: string) {
    this.prng = mulberry32(seedFromString(seed));
  }

  next(): number {
    return this.prng();
  }

  shuffle<T>(list: T[]): void {
    // Fisher-Yates shuffle
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
  }
}

export default {
  install(app: App) {
    const uuid = uuidv4();
    const rnd = new Rnd(uuid);
    app.provide(rndKey, rnd);
  },
};
