import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { defineStore } from "pinia";

import { nextCaptains as suggestCaptains } from "@/game/captains";
import { roster } from "@/game/roster";
import type { RosterEntry } from "@/game/roster";
import { Captain } from "@/game/types";

export { Captain } from "@/game/types";

export interface Player extends RosterEntry {
  captain: Captain;
  online: boolean;
}

export const usePlayersStore = defineStore("players", () => {
  const router = useRouter();
  const player = ref("");
  const captainsTurn = ref(1);

  const players = reactive<Record<string, Player>>(
    Object.fromEntries(
      Object.entries(roster).map(([username, entry]) => [
        username,
        { ...entry, captain: Captain.None, online: false },
      ]),
    ),
  );

  const addPlayer = (p: string, captain: Captain) => {
    if (!players[p]) return;

    players[p].captain = captain;
    players[p].online = true;
  };

  const removePlayer = (p: string) => {
    if (!players[p]) return;

    players[p].captain = Captain.None;
    players[p].online = false;
  };

  const setPlayer = (p: string) => {
    if (!players[p]) return;

    player.value = p;
    players[p].online = true;
    players[p].captain = Captain.None;
  };

  const setCaptain = (p: string, captain: Captain) => {
    if (
      players[p] &&
      (captain == Captain.None ||
        captain == Captain.Red ||
        captain == Captain.Blue)
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

  const setCaptainsTurn = (turn: number) => {
    if (Number.isInteger(turn) && turn > 0) captainsTurn.value = turn;
  };

  const nextCaptains = (seed: string, turn: number): [string, string] =>
    suggestCaptains(seed, turn, Object.keys(roster));

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
    setCaptainsTurn,
    nextCaptains,
    logout,
    $reset,
  };
});
