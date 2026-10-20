export const nextCaptains = (
  names: readonly string[],
  turn: number,
): [string, string] => {
  const index = ((turn - 1) % names.length) * 2;
  return [names[index % names.length], names[(index + 1) % names.length]];
};
