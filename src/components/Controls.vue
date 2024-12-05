<script setup>
import { computed, inject } from "vue";
import { storeToRefs } from "pinia";

import { useGameStore } from "@/stores/game.js";
import { CardState } from "@/assets/states.js";

const score = computed(() => {
    let score = { red: 0, blue: 0, gameOver: "none" };

    board.value.forEach((c) => {
        switch (c.state) {
            case CardState.RedClosed:
                score.red += 1;
                break;
            case CardState.BlueClosed:
                score.blue += 1;
                break;
            case CardState.BlackOpened:
                score.gameOver = "black";
        }
    });

    if (score.gameOver == "none" && score.red == 0) {
        score.gameOver = "red";
    }

    if (score.gameOver == "none" && score.blue == 0) {
        score.gameOver = "blue";
    }

    if (score.red == 0 && score.blue == 0) {
        score.gameOver = "waiting";
    }

    /*
  FIXME: maybe add later if we want this behaviour
  if (score.gameOver != 'none') {
    // all even are open, odds are closed, so just shift down
    board.value.forEach((c) => {
      if (c.closed()) {
        c.state -= 1
      }
    })
  }
  */

    return score;
});

const broker = inject("broker");
const { isCaptainView, board } = storeToRefs(useGameStore());
</script>

<template>
    <div class="grid grid-cols-5 gap-4 text-4xl">
        <div class="flex justify-center">
            <div class="text-black" v-show="score.gameOver == 'black'">
                Both teams lost
            </div>
            <div class="text-code-red-700" v-show="score.gameOver == 'red'">
                Red team won
            </div>
            <div class="text-code-blue-700" v-show="score.gameOver == 'blue'">
                Blue team won
            </div>
        </div>
        <div class="flex justify-center text-code-red-700">
            {{ score.red }}
        </div>
        <div class="flex justify-center">
            <button
                class="w-2/3 h-12 px-4 py-0 bg-teal-700 shadow-lg shadow-teal-500/50 text-white rounded-md cursor-pointer active:scale-[.97] font-sans xl:text-2xl lg:text-xl md:text-sm"
                @click="broker.nextGame()"
            >
                New game
            </button>
        </div>
        <div class="flex justify-center text-code-blue-700">
            {{ score.blue }}
        </div>
        <div class="flex justify-center">
            <label
                class="inline-flex items-center cursor-pointer"
                :class="isCaptainView ? 'switch-on' : 'switch-off'"
                for="captain"
            >
                <img class="size-8 mr-2" src="@/assets/crown.svg" />
                <input
                    type="checkbox"
                    id="captain"
                    v-model="isCaptainView"
                    class="sr-only peer"
                />
                <div
                    class="relative w-14 h-7 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-teal-700"
                ></div>
            </label>
        </div>
    </div>
</template>
