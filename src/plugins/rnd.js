import prng_alea from "esm-seedrandom/esm/alea";

// from https://stackoverflow.com/a/2117523
const uuidv4 = () => {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, function (c) {
    return (
      c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
    ).toString(16);
  });
};

class Rnd {
  #prng;
  constructor(seed) {
    this.#prng = prng_alea(seed);
  }

  mash(seed) {
    this.#prng = prng_alea(seed);
  }

  next() {
    return this.#prng.quick();
  }
}

export default {
  install(app) {
    const uuid = uuidv4();
    const rnd = new Rnd(uuid);
    app.provide("rnd", rnd);
  },
};
