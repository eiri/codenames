import { createRandom } from "./random";

export const nextCaptains = (
  seed: string,
  turn: number,
  players: readonly string[],
): [string, string] => {
  const names = players.slice();
  createRandom(seed).shuffle(names);
  const index = ((turn - 1) % names.length) * 2;
  return [names[index % names.length], names[(index + 1) % names.length]];
};
