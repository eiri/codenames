import { ref, computed } from "vue";
import { defineStore } from "pinia";
import { GameResult } from "@/game/types";
import type { CardSnapshot, RoomSnapshot } from "@/game/snapshot";

export { GameResult } from "@/game/types";

export const useGameStore = defineStore("game", () => {
  const revision = ref(0);
  const turn = ref(1);
  const board = ref<CardSnapshot[]>([]);
  const redScore = ref(8);
  const blueScore = ref(7);
  const gameOver = ref(GameResult.InProgress);
  const connected = ref(false);
  const pending = ref(false);
  const error = ref("");
  const canMutate = computed(() => connected.value && !pending.value);
  const hasOpenCards = computed(() => board.value.some((card) => card.open));

  const applySnapshot = (snapshot: RoomSnapshot) => {
    if (snapshot.revision < revision.value) return;
    revision.value = snapshot.revision;
    turn.value = snapshot.round;
    board.value = snapshot.board;
    redScore.value = snapshot.scores.red;
    blueScore.value = snapshot.scores.blue;
    gameOver.value = snapshot.result;
  };

  const $reset = () => {
    revision.value = 0;
    turn.value = 1;
    board.value = [];
    redScore.value = 8;
    blueScore.value = 7;
    gameOver.value = GameResult.InProgress;
    connected.value = false;
    pending.value = false;
    error.value = "";
  };

  return {
    revision, turn, board, redScore, blueScore, gameOver, hasOpenCards,
    connected, pending, error, canMutate, applySnapshot, $reset,
  };
});
