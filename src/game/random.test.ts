import { expect, it, vi } from "vitest";
import { shuffle } from "./random";

it("rejects biased random values and keeps every shuffled item", () => {
  const values = [0xffffffff, 0, 0];
  const random = vi.spyOn(crypto, "getRandomValues").mockImplementation((buffer) => {
    (buffer as Uint32Array)[0] = values.shift()!;
    return buffer;
  });
  try {
    const list = [1, 2, 3];
    shuffle(list);
    expect(list).toEqual([2, 3, 1]);
    expect(random).toHaveBeenCalledTimes(3);
  } finally {
    random.mockRestore();
  }
});
