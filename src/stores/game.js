import { ref, reactive, inject } from "vue";
import { defineStore } from "pinia";

import words from "@/assets/words.json";
import { CardState } from "@/assets/states";

export const useGameStore = defineStore("game", () => {
  const boardSize = 25;

  const rnd = inject("rnd");

  const gameKey = ref("");
  const board = ref(
    Array(boardSize)
      .fill()
      .map(() => {
        return {
          word: "",
          state: CardState.WhiteOpened,
          closed() {
            return this.state % 2 == 1;
          },
        };
      }),
  );
  const score = reactive({
    red: Math.round((boardSize - 1) / 3),
    blue: Math.round((boardSize - 1) / 3) - 1,
  });
  const gameOver = ref("");

  const getState = () => {
    if (gameKey.value == "") {
      buildGame(null);
    }
    return {
      key: gameKey.value,
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

  const randomCards = (size) => {
    const red = Math.round((size - 1) / 3);
    const blue = red - 1;
    const white = size - red - blue - 1;
    let cards = [CardState.BlackClosed]
      .concat(Array(red).fill(CardState.RedClosed))
      .concat(Array(blue).fill(CardState.BlueClosed))
      .concat(Array(white).fill(CardState.WhiteClosed));

    // Fisher-Yates shuffle
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(rnd.next() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }

    return cards;
  };

  const randomWord = () => {
    const randomIndex = Math.floor(rnd.next() * words.length);
    return words[randomIndex];
  };

  const randomWords = (size) => {
    let words = {};
    do {
      words[randomWord()] = true;
    } while (Object.keys(words).length < size);
    return Object.keys(words);
  };

  const nextWord = () => {
    let word = gameKey.value;
    do {
      word = randomWord();
    } while (word == gameKey.value);
    return word;
  };

  const buildGame = (key) => {
    gameKey.value = key;
    if (gameKey.value == null || gameKey.value == "") {
      gameKey.value = nextWord();
    }
    console.debug(`buildGame for ${gameKey.value}`);
    rnd.mash(gameKey.value);

    const cards = randomCards(boardSize);
    const words = randomWords(boardSize);

    board.value = [];
    for (let i in cards) {
      board.value.push({
        idx: i,
        state: cards[i],
        word: words[i],
        closed() {
          return this.state % 2 == 1;
        },
      });
    }
    score.red = Math.round((boardSize - 1) / 3);
    score.blue = score.red - 1;
    gameOver.value = "";
  };

  const $reset = () => {
    gameKey.value = "";
    board.value = Array(boardSize)
      .fill()
      .map(() => {
        return {
          word: "",
          state: CardState.WhiteOpened,
          closed() {
            return this.state % 2 == 1;
          },
        };
      });
    score.red = Math.round((boardSize - 1) / 3);
    score.blue = score.red - 1;
    gameOver.value = "";
  };

  return {
    gameKey,
    board,
    score,
    gameOver,
    getState,
    setState,
    open,
    buildGame,
    $reset,
  };
});
