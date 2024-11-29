import { ref, inject } from "vue";
import { defineStore } from "pinia";

import words from "@/assets/words.json";
import { CardState } from "@/assets/states";

export const useGameStore = defineStore("game", () => {
  const boardSize = 25;

  const rnd = inject("rnd");
  const broker = inject("broker");

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

  const isCaptain = ref(false);
  const gameKey = ref("");

  const username = localStorage.getItem("username");
  const password = localStorage.getItem("password");
  const room = localStorage.getItem("room");

  // callbacks
  const onReqState = ({ data }) => {
    console.debug(`received reqState ${JSON.stringify(data)} as ${username}`);
    if (data.to != username) {
      return;
    }
    const payload = {
      state: getState(),
      to: data.from,
    };
    console.debug(`publish ackState ${JSON.stringify(payload)}`);
    broker.channel.publish("ackState", payload);
  };

  const onAckState = ({ data }) => {
    console.debug(`received ackState ${JSON.stringify(data)} as ${username}`);
    const {
      to,
      state: { key, state },
    } = data;
    if (to != username || key == gameKey.value) {
      return;
    }
    gameKey.value = key;
    buildGame();
    board.value.forEach((card, i) => (card.state = state[i]));
    console.debug(`subscribed: ok (${gameKey.value})`);
  };

  const onOpen = ({ data }) => {
    console.debug(`received open ${JSON.stringify(data)} as ${username}`);
    const idx = data.idx;
    if (board.value[idx] && board.value[idx].closed()) {
      board.value[idx].state -= 1;
    }
  };

  const onNextGame = ({ data }) => {
    console.debug(`received nextGame ${JSON.stringify(data)} as ${username}`);
    gameKey.value = data.gameKey;
    buildGame();
  };

  const connect = async () => {
    if (username == null || room == null) {
      console.error(`missing username or room ${username} ${room}`);
      return;
    }
    // connect ot broker, enter presence
    await broker.connect(username, password, room);
    // set channel callbacks
    broker.channel.subscribe("reqState", onReqState);
    broker.channel.subscribe("ackState", onAckState);

    broker.channel.subscribe("open", onOpen);
    broker.channel.subscribe("nextGame", onNextGame);
    // sync state
    console.debug(`syncLeader: ${broker.syncLeader}`);
    const payload = {
      from: username,
      to: broker.syncLeader,
    };
    console.debug(`publish reqState ${JSON.stringify(payload)}`);
    broker.channel.publish("reqState", payload);
  };

  const disconnect = async () => {
    await broker.disconnect(username);
  };

  const getState = () => {
    if (gameKey.value == "") {
      gameKey.value = nextWord();
      buildGame();
    }
    return {
      key: gameKey.value,
      state: board.value.map((c) => c.state),
    };
  };

  const open = (idx) => {
    if (board.value[idx] && board.value[idx].closed()) {
      const payload = { idx };
      console.debug(`publish open ${JSON.stringify(payload)}`);
      broker.channel.publish("open", payload);
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

  // FIXME: it is possible to get same board in a single session
  // so better is to keep fixed sized table of unique words
  // to make sure there are at least N unique boards
  const nextGame = () => {
    gameKey.value = nextWord();
    const payload = { gameKey: gameKey.value };
    console.debug(`publish nextGame ${JSON.stringify(payload)}`);
    broker.channel.publish("nextGame", payload);
  };

  const buildGame = () => {
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

    isCaptain.value = false;
  };

  const $reset = () => {
    gameKey.value = "";
    isCaptain.value = false;
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
  };

  return {
    gameKey,
    isCaptain,
    board,
    getState,
    open,
    connect,
    disconnect,
    nextGame,
    $reset,
  };
});
