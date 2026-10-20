import { ref, computed } from "vue";
import { defineStore } from "pinia";
import { roster } from "@/game/roster";
import { Captain } from "@/game/types";
import type { RoomSnapshot } from "@/game/snapshot";

export type Player = RoomSnapshot["players"][number];

const initialPlayers = (): Record<string, Player> => Object.fromEntries(
  Object.entries(roster).map(([username, entry]) => [
    username, { ...entry, username, captain: Captain.None, captainView: false, online: false },
  ]),
);

export const usePlayersStore = defineStore("players", () => {
  const username = ref("");
  const players = ref(initialPlayers());
  const captainsTurn = ref(1);
  const captains = ref<[string, string]>(["", ""]);
  const isCaptainView = computed(() => players.value[username.value]?.captainView ?? false);
  const isRedCaptain = computed(() => players.value[username.value]?.captain == Captain.Red);
  const isBlueCaptain = computed(() => players.value[username.value]?.captain == Captain.Blue);

  const applySnapshot = (snapshot: RoomSnapshot) => {
    players.value = Object.fromEntries(snapshot.players.map((entry) => [entry.username, entry]));
    captainsTurn.value = snapshot.captainTurn;
    captains.value = snapshot.captains;
  };

  const $reset = () => {
    username.value = "";
    players.value = initialPlayers();
    captainsTurn.value = 1;
    captains.value = ["", ""];
  };

  return { username, players, captainsTurn, captains, isCaptainView, isRedCaptain, isBlueCaptain, applySnapshot, $reset };
});
