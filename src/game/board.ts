import allWords from "../assets/words.json";
import { createRandom } from "./random";
import { boardSize } from "./rules";
import { CardState } from "./types";
import type { Card } from "./types";

const red = Math.round((boardSize - 1) / 3);
const blue = red - 1;
const white = boardSize - red - blue - 1;

export const buildDeck = (seed: string): Card[] => {
  const rnd = createRandom(seed);
  const dictionary = allWords.slice();
  rnd.shuffle(dictionary);

  const round: CardState[] = [CardState.BlackClosed]
    .concat(Array(red).fill(CardState.RedClosed))
    .concat(Array(blue).fill(CardState.BlueClosed))
    .concat(Array(white).fill(CardState.WhiteClosed));
  const deck: Card[] = [];

  // Shuffle words once, then colors for each complete board.
  for (let i = 0; i + boardSize <= dictionary.length; i += boardSize) {
    const words = dictionary.slice(i, i + boardSize);
    const cards = round.slice();
    rnd.shuffle(cards);
    for (const idx of cards.keys()) {
      deck.push({ idx, word: words[idx], state: cards[idx] });
    }
  }

  return deck;
};

export const buildBoard = (deck: readonly Card[], turn: number): Card[] => {
  if (!Number.isInteger(turn) || turn < 1 || deck.length == 0) return [];

  const rounds = deck.length / boardSize;
  const start = boardSize * ((turn - 1) % rounds);

  // Copy cards so opening a board never changes the deck.
  return deck.slice(start, start + boardSize).map((card) => ({ ...card }));
};
