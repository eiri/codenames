import { ref, inject, computed } from "vue";
import { defineStore } from "pinia";

import allWords from "@/assets/words.json";
import { CardState } from "@/assets/states";

class Card {
  constructor({ idx, word = "...", state = CardState.WhiteClosed }) {
    this.idx = idx;
    this.word = word;
    this.state = state;
  }
  closed() {
    return this.state % 2 == 1;
  }
}

export const useGameStore = defineStore("game", () => {
  const rnd = inject("rnd");
  const boardSize = 25;
  // build round of cards based on board size
  const red = Math.round((boardSize - 1) / 3);
  const blue = red - 1;
  const white = boardSize - red - blue - 1;
  const round = [CardState.BlackClosed]
    .concat(Array(red).fill(CardState.RedClosed))
    .concat(Array(blue).fill(CardState.BlueClosed))
    .concat(Array(white).fill(CardState.WhiteClosed));
  let deck = [];

  const turn = ref(1);
  const board = ref([]);

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
      return "Both teams lost";
    if (redScore.value == 0) return "Red team won";
    if (blueScore.value == 0) return "Blue team won";
    return "";
  });

  const shuffle = (desk) => {
    // Fisher-Yates shuffle
    for (let i = desk.length - 1; i > 0; i--) {
      const j = Math.floor(rnd.next() * (i + 1));
      [desk[i], desk[j]] = [desk[j], desk[i]];
    }
  };

  const setSeed = (seed) => {
    rnd.mash(seed);
    const dictionary = allWords.slice();
    shuffle(dictionary);

    for (let i = 0; i < dictionary.length; i += boardSize) {
      const words = dictionary.slice(i, i + boardSize);
      const cards = round.slice();
      shuffle(cards);
      for (let idx in cards) {
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

  const setState = (state) => {
    board.value.forEach((card, i) => (card.state = state[i]));
  };

  const open = (idx) => {
    if (board.value[idx] && board.value[idx].closed()) {
      board.value[idx].state -= 1;
    }
  };

  const buildGame = (nextTurn) => {
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
