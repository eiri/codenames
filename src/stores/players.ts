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

  function fairRearrange<T>(pairs: [T, T][]): [T, T][] {
    const result: [T, T][] = [];
    const used: Set<T> = new Set();
    let recent: Set<T> = new Set();
    const remaining: [T, T][] = [...pairs];

    while (remaining.length > 0) {
      let progress = false;

      // Try normal scheduling (avoid used & recent)
      for (let i = 0; i < remaining.length; i++) {
        const [a, b] = remaining[i];
        if (!used.has(a) && !used.has(b) && !recent.has(a) && !recent.has(b)) {
          result.push([a, b]);
          used.add(a);
          used.add(b);
          recent = new Set([a, b]);
          remaining.splice(i, 1);
          progress = true;
          break;
        }
      }

      if (!progress) {
        // No pair could be scheduled without conflict
        // Force a pair (ignore recent) to ensure progress
        const [a, b] = remaining.shift()!;
        result.push([a, b]);
        used.add(a);
        used.add(b);
        recent = new Set([a, b]);
        // continue loop
      }

      // Reset used if no pair was added in normal scheduling
      if (used.size >= 0 && !progress) {
        used.clear();
      }
    }

    return result;
  }

  const nextCaptains = (seed: string, turn: number): [string, string] => {
    rnd.mash(seed);
    const names = Object.keys(players);
    // all permutations
    const pairs: [string, string][] = names.flatMap((a) =>
      names.filter((b) => a !== b).map((b) => [a, b] as [string, string]),
    );
    rnd.shuffle(pairs);
    //greedy non-conflicting scheduling
    const fairPairs = fairRearrange(pairs);
    // slice for the given turn
    const wrappedIdx =
      (((turn - 1) % fairPairs.length) + fairPairs.length) % fairPairs.length;
    return fairPairs[wrappedIdx];
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
