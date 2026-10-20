export const shuffle = <T>(list: T[]): void => {
  const bytes = new Uint32Array(1);
  for (let i = list.length - 1; i > 0; i--) {
    const range = i + 1;
    const limit = 0x100000000 - (0x100000000 % range);

    // Reject the uneven tail so each position has the same probability.
    do {
      crypto.getRandomValues(bytes);
    } while (bytes[0] >= limit);

    const j = bytes[0] % range;
    [list[i], list[j]] = [list[j], list[i]];
  }
};
