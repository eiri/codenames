import { ref, computed } from "vue";
import { defineStore } from "pinia";

import { buildBoard, buildDeck } from "@/game/board";
import { gameResult, hasOpenCards as anyOpen, openCard, scores } from "@/game/rules";
import type { Card } from "@/game/types";

export { CardState, GameResult } from "@/game/types";
export type { Card } from "@/game/types";

export const useGameStore = defineStore("game", () => {
  let deck: Card[] = [];

  const seed = ref("");
  const turn = ref(1);
  const board = ref<Card[]>([]);

  const score = computed(() => scores(board.value));
  const redScore = computed(() => score.value.red);
  const blueScore = computed(() => score.value.blue);
  const gameOver = computed(() => gameResult(board.value));
  const hasOpenCards = computed(() => anyOpen(board.value));

  const setSeed = (newSeed: string) => {
    seed.value = newSeed;
    deck = buildDeck(newSeed);
    buildGame(turn.value);
  };

  const getState = () => ({
    turn: turn.value,
    state: board.value.map((card) => card.state),
  });

  const setState = (state: number[]) => {
    board.value.forEach((card, i) => (card.state = state[i]));
  };

  const open = (idx: number) => openCard(board.value, idx);

  const buildGame = (nextTurn: number) => {
    const cards = buildBoard(deck, nextTurn);
    if (cards.length == 0) return;

    turn.value = nextTurn;
    board.value = cards;
  };

  const $reset = () => {
    deck = [];
    turn.value = 1;
    board.value = [];
  };

  return {
    seed,
    turn,
    board,
    redScore,
    blueScore,
    gameOver,
    hasOpenCards,
    setSeed,
    getState,
    setState,
    open,
    buildGame,
    $reset,
  };
});
