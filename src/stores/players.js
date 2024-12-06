import { ref, reactive } from "vue";
import { defineStore } from "pinia";

export const usePlayersStore = defineStore("players", () => {
  const player = ref("");
  const players = ref({});

  const regulars = reactive({
    Eiri: {
      name: "Eiri",
      lj: "eiri",
      avatar: "https://l-userpic.livejournal.com/38941189/689880", // https://l-userpic.livejournal.com/127274177/689880
    },
    Akari: {
      name: "Akari",
      lj: "akari_chan",
      avatar: "https://l-userpic.livejournal.com/120407741/755293",
    },
    Vitaliy: {
      name: "Vitaliy",
      lj: "seminarist",
      avatar: "https://l-userpic.livejournal.com/45172718/788486",
    },
    Ikadell: {
      name: "Ikadell",
      lj: "ikadell",
      avatar: "https://l-userpic.livejournal.com/11807164/1840678",
    },
    Friday: {
      name: "Friday",
      lj: "next_friday",
      avatar: "https://l-userpic.livejournal.com/57379634/818233",
    },
  });

  const addPlayer = (p, data) => {
    players.value[p] = {
      name: p,
      avatar: regulars[p]
        ? regulars[p].avatar
        : "http://placekitten.com/250/250",
      captain: data ? data.isCaptain : false,
      team: "white",
    };
  };

  const removePlayer = (p) => {
    delete players.value[p];
  };

  const setPlayer = (p) => {
    player.value = p;
  };

  const setCaptain = (p, isCaptain) => {
    players.value[p].captain = isCaptain;
  };

  const isCaptainView = () => {
    const me = players.value[player.value];
    return me ? me.captain : false;
  };

  const newGame = () => {
    for (const p in players.value) {
      players.value[p].captain = false;
    }
  };

  const $reset = () => {
    player.value = "";
    players.value = {};
  };

  return {
    players,
    regulars,
    addPlayer,
    removePlayer,
    setPlayer,
    setCaptain,
    isCaptainView,
    newGame,
    $reset,
  };
});
