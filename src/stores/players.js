import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { defineStore } from "pinia";

export const usePlayersStore = defineStore("players", () => {
  const router = useRouter();
  const player = ref("");

  const Captain = Object.freeze({
    None: 0,
    Red: 1,
    Blue: 2,
  });

  const players = reactive({
    Akari: {
      name: "Akari",
      lj: "akari_chan",
      avatar: "https://l-userpic.livejournal.com/120407741/755293",
      captain: Captain.None,
      online: false,
    },
    Eiri: {
      name: "Eiri",
      lj: "eiri",
      avatar: "https://l-userpic.livejournal.com/38941189/689880", // https://l-userpic.livejournal.com/127274177/689880
      captain: Captain.None,
      online: false,
    },
    Ikadell: {
      name: "Ikadell",
      lj: "ikadell",
      avatar: "https://l-userpic.livejournal.com/11807164/1840678",
      captain: Captain.None,
      online: false,
    },
    Friday: {
      name: "Friday",
      lj: "next_friday",
      avatar: "https://l-userpic.livejournal.com/57379634/818233",
      captain: Captain.None,
      online: false,
    },
    Vitaliy: {
      name: "Vitaliy",
      lj: "seminarist",
      avatar: "https://l-userpic.livejournal.com/45172718/788486",
      captain: Captain.None,
      online: false,
    },
  });

  const addPlayer = (p, data) => {
    let captain = Captain.None;
    if (data && data.captain) {
      captain = data.captain;
    }
    players[p].captain = captain;
    players[p].online = true;
  };

  const removePlayer = (p) => {
    players[p].captain = Captain.None;
    players[p].online = false;
  };

  const setPlayer = (p) => {
    player.value = p;
  };

  const setCaptain = (p, captain) => {
    if (
      captain == Captain.None ||
      captain == Captain.Red ||
      captain == Captain.Blue
    ) {
      players[p].captain = captain;
    }
  };

  const isRedCaptain = () => {
    const me = players[player.value];
    return me ? me.captain == Captain.Red : false;
  };

  const isRedCaptainTaken = () => {
    return Object.values(players).some((p) => p.captain == Captain.Red);
  };

  const isBlueCaptain = () => {
    const me = players[player.value];
    return me ? me.captain == Captain.Blue : false;
  };

  const isBlueCaptainTaken = () => {
    return Object.values(players).some((p) => p.captain == Captain.Blue);
  };

  const isCaptainView = () => {
    const me = players[player.value];
    return me ? me.captain != Captain.None : false;
  };

  const newGame = () => {
    for (const p in players) {
      players[p].captain = Captain.None;
    }
  };

  const logout = () => {
    router.push("/");
  };

  const $reset = () => {
    player.value = "";
    for (const p in players) {
      players[p].captain = Captain.None;
      players[p].online = false;
    }
  };

  return {
    players,
    addPlayer,
    removePlayer,
    setPlayer,
    setCaptain,
    isRedCaptain,
    isRedCaptainTaken,
    isBlueCaptain,
    isBlueCaptainTaken,
    isCaptainView,
    newGame,
    logout,
    $reset,
  };
});
