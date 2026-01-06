declare module "esm-seedrandom/esm/alea" {
  const alea: (seed?: string) => { quick: () => number };
  export default alea;
}
