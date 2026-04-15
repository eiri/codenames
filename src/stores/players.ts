import { ref, inject, reactive } from "vue";
import { useRouter } from "vue-router";
import { defineStore } from "pinia";

import { rndKey, Rnd } from "@/plugins/rnd";

export enum Captain {
  None = 0,
  Red = 1,
  Blue = 2,
}

export interface Player {
  name: string;
  lj: string;
  avatar: string;
  captain: Captain;
  online: boolean;
}

export const usePlayersStore = defineStore("players", () => {
  const rnd = inject<Rnd>(rndKey);
  const router = useRouter();
  const player = ref("");
  const captainsTurn = ref(1);

  const players = reactive<Record<string, Player>>({
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

  const addPlayer = (p: string, captain: Captain) => {
    players[p].captain = captain;
    players[p].online = true;
  };

  const removePlayer = (p: string) => {
    players[p].captain = Captain.None;
    players[p].online = false;
  };

  const setPlayer = (p: string) => {
    player.value = p;
    players[p].online = true;
    players[p].captain = Captain.None;
  };

  const setCaptain = (p: string, captain: Captain) => {
    if (
      captain == Captain.None ||
      captain == Captain.Red ||
      captain == Captain.Blue
    ) {
      players[p].captain = captain;
    }
  };

  const getPlayers = (): { player: string; captain: Captain }[] => {
    return Object.values(players)
      .filter((p) => p.online)
      .map((p) => ({ player: p.name, captain: p.captain }));
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

  const newGame = (nextTurn: number) => {
    for (const p in players) {
      players[p].captain = Captain.None;
    }
    captainsTurn.value = nextTurn;
  };

  const nextCaptains = (seed: string, turn: number): [string, string] => {
    rnd.mash(seed);
    const names = Object.keys(players);
    rnd.shuffle(names);
    const index = ((turn - 1) % names.length) * 2;
    return [names[index % names.length], names[(index + 1) % 5]];
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
    captainsTurn,
    players,
    addPlayer,
    removePlayer,
    setPlayer,
    setCaptain,
    getPlayers,
    isRedCaptain,
    isRedCaptainTaken,
    isBlueCaptain,
    isBlueCaptainTaken,
    isCaptainView,
    newGame,
    nextCaptains,
    logout,
    $reset,
  };
});
