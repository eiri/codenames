import { AES } from "crypto-es/lib/aes";
import { Utf8 } from "crypto-es/lib/core";
import Ably from "ably";

import { ref, inject } from "vue";
import { defineStore } from "pinia";

import words from "@/assets/words.json";
import { CardState } from "@/assets/states";

export const useGameStore = defineStore("game", () => {
  const boardSize = 25;
  // https://colorkit.co/palette/ffadad-ffd6a5-fdffb6-caffbf-9bf6ff-a0c4ff-bdb2ff-ffc6ff/
  const palette = [
    "#ffadad",
    "#ffd6a5",
    "#fdffb6",
    "#caffbf",
    "#9bf6ff",
    "#a0c4ff",
    "#bdb2ff",
    "#ffc6ff",
  ];
  // from https://stackoverflow.com/a/50579690
  const crc32 = function (r) {
    for (var a, o = [], c = 0; c < 256; c++) {
      a = c;
      for (var f = 0; f < 8; f++) a = 1 & a ? 3988292384 ^ (a >>> 1) : a >>> 1;
      o[c] = a;
    }
    for (var n = -1, t = 0; t < r.length; t++)
      n = (n >>> 8) ^ o[255 & (n ^ r.charCodeAt(t))];
    return (-1 ^ n) >>> 0;
  };

  const rnd = inject("rnd");

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

  const players = ref({});
  const isCaptain = ref(false);
  const gameKey = ref("");

  const password = localStorage.getItem("password");
  const decrypted = AES.decrypt(import.meta.env.VITE_KEY_CIPHERTEXT, password);
  const ablyAPIKey = decrypted.toString(Utf8);
  console.assert(ablyAPIKey != "");

  let broker = new Ably.Realtime({
    key: ablyAPIKey,
    autoConnect: false,
    transportParams: { heartbeatInterval: 300000 },
  });

  let username = null;
  let room = null;
  let channel = null;

  // callbacks
  const syncState = (err, members) => {
    if (err != null) {
      console.error(err);
      return;
    }
    console.debug(`members: ${members.length}`);
    if (members.length == 0) {
      // assume this player is the first one
      console.debug(`subscribed: ok (${gameKey.value})`);
      nextGame();
      channel.presence.enterClient(username);
      return;
    }
    // if there was a browser refresh don't ask yourself about state
    delete players[username];
    // add all to list and ask top player for game state
    for (let i in members) {
      const player = members[i].clientId;
      const playerData = {
        name: player,
        short: player[0],
        color: palette[crc32(player) % palette.length],
        captain: false,
        team: "white",
      };
      players.value[player] = playerData;
      // FIXME: race here if top ack client quit after reqState
      // but that's ok for now
      // ask game state from a first presented player
      if (i == 0) {
        const payload = {
          from: username,
          to: player,
        };
        console.debug(`publish reqState ${JSON.stringify(payload)}`);
        channel.publish("reqState", payload);
      }
    }
  };

  const onPlayerEnter = (member) => {
    if (member.clientId in players) {
      return;
    }
    console.debug(`presence enter member ${JSON.stringify(member)}`);
    const player = member.clientId;
    const playerData = {
      name: player,
      short: player[0],
      color: palette[crc32(player) % palette.length],
      captain: false,
      team: "white",
    };
    players.value[player] = playerData;
  };

  const onPlayerLeave = (member) => {
    // browser refresh
    if (member.clientId == username) {
      return;
    }
    console.debug(`presence leave member ${JSON.stringify(member)}`);
    delete players.value[member.clientId];
  };

  const onReqState = ({ data }) => {
    console.debug(`received reqState ${JSON.stringify(data)} as ${username}`);
    if (data.to != username) {
      return;
    }
    const payload = {
      gameKey: gameKey.value,
      state: board.value.map((c) => ({ state: c.state, word: c.word })),
      to: data.from,
    };
    console.debug(`publish ackState ${JSON.stringify(payload)}`);
    channel.publish("ackState", payload);
  };

  const onAckState = ({ data }) => {
    console.debug(`received ackState ${JSON.stringify(data)} as ${username}`);
    if (data.to != username || data.gameKey == gameKey.value) {
      console.debug(
        `invalid ackState ${data.to} and ${data.gameKey} vs ${gameKey.value}`,
      );
      return;
    }
    gameKey.value = data.gameKey;
    board.value = [];
    for (let i in data.state) {
      const card = data.state[i];
      board.value.push({
        idx: i,
        state: card.state,
        word: card.word,
        closed() {
          return this.state % 2 == 1;
        },
      });
    }
    console.debug(`subscribed: ok (${gameKey.value})`);
    channel.presence.enterClient(username);
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

  const connect = () => {
    console.debug("connect");
    username = localStorage.getItem("username");
    room = localStorage.getItem("room");

    if (username == null || room == null) {
      console.error(`missing username or room ${username} ${room}`);
      return;
    }

    channel = broker.channels.get(`room-${room}`);

    // debug logger
    broker.connection.on((stateChange) => {
      console.debug(`connection state ${JSON.stringify(stateChange)}`);
    });

    broker.connection.on("connected", () => {
      channel.presence.subscribe("enter", onPlayerEnter);
      channel.presence.subscribe("leave", onPlayerLeave);

      channel.subscribe("reqState", onReqState);
      channel.subscribe("ackState", onAckState);

      channel.subscribe("open", onOpen);
      channel.subscribe("nextGame", onNextGame);

      channel.presence.get(syncState);
    });

    broker.connect();
  };

  const disconnect = () => {
    console.debug("disconnect");
    if (channel == null) {
      console.error("channel is null");
      return;
    }
    channel.presence.leaveClient(username, () => {
      channel.presence.unsubscribe();
      channel.unsubscribe();
      channel.detach();
      broker.connection.off();
      broker.close();
      channel = null;
    });
  };

  const open = (idx) => {
    if (board.value[idx] && board.value[idx].closed()) {
      const payload = { idx };
      console.debug(`publish open ${JSON.stringify(payload)}`);
      channel.publish("open", payload);
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
    channel.publish("nextGame", payload);
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
    players.value = {};
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
    players,
    board,
    open,
    connect,
    disconnect,
    nextGame,
    $reset,
  };
});
