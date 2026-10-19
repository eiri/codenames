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

export const createRandom = (seed: string) => {
  let prng = mulberry32(seedFromString(seed));

  const mash = (seed: string) => {
    prng = mulberry32(seedFromString(seed));
  };

  const next = () => prng();

  const shuffle = <T>(list: T[]): void => {
    // Keep the shuffle order stable for existing seeds.
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
  };

  return { mash, next, shuffle };
};
