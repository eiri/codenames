import { ref, reactive, inject } from "vue";
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
  const gameOver = ref("Loading...");
  const board = ref([]);
  const score = reactive({
    red: Math.round((boardSize - 1) / 3),
    blue: Math.round((boardSize - 1) / 3) - 1,
  });

  const shuffle = (desk) => {
    // Fisher-Yates shuffle
    for (let i = desk.length - 1; i > 0; i--) {
      const j = Math.floor(rnd.next() * (i + 1));
      [desk[i], desk[j]] = [desk[j], desk[i]];
    }
  };

  const setSeed = (seed) => {
    console.debug(`game store: seed rnd with ${seed}`);
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
      if (board.value[idx].state == CardState.RedOpened) {
        score.red -= 1;
        if (score.red == 0) {
          gameOver.value = "Red team won";
        }
      }
      if (board.value[idx].state == CardState.BlueOpened) {
        score.blue -= 1;
        if (score.blue == 0) {
          gameOver.value = "Blue team won";
        }
      }
      if (board.value[idx].state == CardState.BlackOpened) {
        gameOver.value = "Both teams lost";
      }
    }
  };

  const buildGame = (nextTurn) => {
    turn.value = nextTurn;
    const start = boardSize * (turn.value - 1);
    const end = start + boardSize;
    gameOver.value = "";
    board.value = deck.slice(start, end);
    score.red = Math.round((boardSize - 1) / 3);
    score.blue = score.red - 1;
  };

  const $reset = () => {
    deck = [];
    turn.value = 1;
    gameOver.value = "Loading...";
    board.value = [];
    score.red = Math.round((boardSize - 1) / 3);
    score.blue = score.red - 1;
  };

  return {
    turn,
    board,
    score,
    gameOver,
    setSeed,
    getState,
    setState,
    open,
    buildGame,
    $reset,
  };
});
