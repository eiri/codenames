import { ref, inject, computed } from "vue";
import { defineStore } from "pinia";

import { rndKey, Rnd } from "@/plugins/rnd";
import allWords from "@/assets/words.json";

export enum GameResult {
  InProgress = 0,
  RedTeamWon = 1,
  BlueTeamWon = 2,
  BothTeamsLost = 3,
}

export enum CardState {
  BlackOpened = 0,
  BlackClosed = 1,
  WhiteOpened = 2,
  WhiteClosed = 3,
  RedOpened = 4,
  RedClosed = 5,
  BlueOpened = 6,
  BlueClosed = 7,
}

interface CardOptions {
  idx: number;
  word?: string;
  state?: CardState;
}

export class Card {
  idx: number;
  word: string;
  state: CardState;

  constructor({
    idx,
    word = "...",
    state = CardState.WhiteClosed,
  }: CardOptions) {
    this.idx = idx;
    this.word = word;
    this.state = state;
  }

  closed() {
    return this.state % 2 == 1;
  }
}

export const useGameStore = defineStore("game", () => {
  const rnd = inject<Rnd>(rndKey);
  const boardSize = 25;
  // build round of cards based on board size
  const red = Math.round((boardSize - 1) / 3);
  const blue = red - 1;
  const white = boardSize - red - blue - 1;
  const round = [CardState.BlackClosed]
    .concat(Array(red).fill(CardState.RedClosed))
    .concat(Array(blue).fill(CardState.BlueClosed))
    .concat(Array(white).fill(CardState.WhiteClosed));
  let deck: Card[] = [];

  const seed = ref("");
  const turn = ref(1);
  const board = ref<Card[]>([]);

  const redScore = computed(() => {
    const count = Math.round((boardSize - 1) / 3);
    const done = board.value.reduce((acc, cur) => {
      if (cur.state == CardState.RedOpened) acc -= 1;
      return acc;
    }, count);
    return done;
  });

  const blueScore = computed(() => {
    const count = Math.round((boardSize - 1) / 3) - 1;
    const done = board.value.reduce((acc, cur) => {
      if (cur.state == CardState.BlueOpened) acc -= 1;
      return acc;
    }, count);
    return done;
  });

  const gameOver = computed(() => {
    if (board.value.some((cur) => cur.state == CardState.BlackOpened))
      return GameResult.BothTeamsLost;
    if (redScore.value == 0) return GameResult.RedTeamWon;
    if (blueScore.value == 0) return GameResult.BlueTeamWon;
    return GameResult.InProgress;
  });

  const setSeed = (newSeed: string) => {
    seed.value = newSeed;
    rnd.mash(seed.value);
    const dictionary = allWords.slice();
    rnd.shuffle(dictionary);

    for (let i = 0; i < dictionary.length; i += boardSize) {
      const words = dictionary.slice(i, i + boardSize);
      const cards = round.slice();
      rnd.shuffle(cards);
      for (const idx of cards.keys()) {
        deck.push(new Card({ idx, word: words[idx], state: cards[idx] }));
      }
    }

    buildGame(turn.value);
  };

  const getState = () => {
    return {
      turn: turn.value,
      state: board.value.map((c) => c.state),
    };
  };

  const setState = (state: number[]) => {
    board.value.forEach((card, i) => (card.state = state[i]));
  };

  const open = (idx: number) => {
    if (board.value[idx] && board.value[idx].closed()) {
      board.value[idx].state -= 1;
    }
  };

  const buildGame = (nextTurn: number) => {
    turn.value = nextTurn;
    const start = boardSize * (turn.value - 1);
    const end = start + boardSize;
    board.value = deck.slice(start, end);
  };

  const $reset = () => {
    deck = [];
    turn.value = 1;
    board.value = [];
  };

  return {
    seed,
    turn,
    board,
    redScore,
    blueScore,
    gameOver,
    setSeed,
    getState,
    setState,
    open,
    buildGame,
    $reset,
  };
});
