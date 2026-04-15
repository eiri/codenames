<script setup lang="ts">
import { ref, inject, computed } from "vue";
import { storeToRefs } from "pinia";

import { GameResult, useGameStore } from "@/stores/game";
import { usePlayersStore } from "@/stores/players";
import { brokerKey, Broker } from "@/plugins/broker";

const broker = inject<Broker>(brokerKey);

const room = ref(sessionStorage.getItem("room"));
const store = useGameStore();
const { turn, redScore, blueScore, gameOver } = storeToRefs(store);

const playersStore = usePlayersStore();
const { players, captainsTurn } = storeToRefs(playersStore);

const gameResult = computed(() => {
  switch (gameOver.value) {
    case GameResult.BothTeamsLost:
      return "Both teams lost";
    case GameResult.RedTeamWon:
      return "Red team won";
    case GameResult.BlueTeamWon:
      return "Blue team won";
    default:
      return "";
  }
});

const nextCaptainTurn = () => (captainsTurn.value += 1);
</script>

<template>
  <div class="flex items-center space-x-2 text-2xl font-sans">
    <div class="cursor-pointer" @click="broker.globalLogout()">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="w-8 h-8 fill-teal-700"
        viewBox="0 0 512 512"
      >
        <path
          d="M271.125 17.813v145.562h66.938V34.5c-20.606-10.187-43.6-15.728-66.938-16.688zm-18.688.218c-22.768 1.465-45.25 7.305-65.53 17.376v127.97h65.53zM356.75 45.5v117.875h61.844c-2.66-48.27-21.532-83.515-48.656-107.53c-4.2-3.72-8.6-7.17-13.188-10.345m-188.53.813c-5.32 3.63-10.403 7.6-15.22 11.906c-27.108 24.233-45.9 58.953-48.656 105.155h63.875V46.312zm269.936 97.312v19.5H459v-19.5zm0 38.188v.25H84.78v32h353.376v.156H459v-32.407zM104 232.75v130.375h64.22v-26.28a39.7 39.7 0 0 1-6.595.56c-21.91 0-39.875-17.965-39.875-39.874c0-21.907 17.964-39.874 39.875-39.874c2.25 0 4.443.2 6.594.563v-25.47zm82.906 0v34.03c8.893 7.334 14.594 18.41 14.594 30.75s-5.7 23.42-14.594 30.75v34.845h65.53V232.75zm84.22 0v130.375h66.937V232.75zm85.624 0v130.375h62.156V232.75zm81.406.156v17.938H459v-17.938zm-276.53 43.438c-11.81 0-21.19 9.38-21.19 21.187c0 11.81 9.378 21.19 21.19 21.19c11.81 0 21.186-9.38 21.186-21.19s-9.376-21.186-21.187-21.186zm276.53 67.03v19.907H459v-19.905h-20.844zM84.78 381.813v32h353.376v.157H459v-32h-18.47v-.158H84.78zM104 432.5v59.844h64.22V432.5zm82.906 0v59.844h65.53V432.5zm84.22 0v59.844h66.937V432.5zm85.624 0v59.844h62.156V432.5zm81.406.156v17.938H459v-17.938z"
        />
      </svg>
    </div>
    <div>{{ room }}</div>
    <div class="pl-3">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="w-8 h-8 fill-teal-700"
        viewBox="0 0 512 512"
      >
        <path
          d="M272.824 24.318c-14.929.312-25.66 3.246-32.767 8.446L142.898 84.91l-54.105 73.514C77.42 175.98 85.517 210 121.111 188.197l38.9-51.351c49.476-42.711 150.485-23.032 102.587 62.591c-23.53 49.582-12.457 73.79 17.76 83.95l13.812-46.381c23.949-53.825 68.502-63.51 66.684-106.904l107.302 7.724l-.865-112.045zm-54.09 103.338c-17.41-.3-34.486 6.898-46.92 17.375l-39.044 51.33c10.713 8.506 21.413 3.96 32.125-6.363c12.626 6.394 22.365-3.522 30.365-23.297c3.317-13.489 8.21-23.037 23.474-39.045m-32.617 88.324a13.5 13.5 0 0 0-5.232 1.235L51.72 276.725c-6.784 3.13-9.763 11.202-6.633 17.992l85.27 185.08c3.131 6.783 11.204 9.779 18 6.635l129.15-59.504c6.796-3.137 9.776-11.198 6.646-18L198.871 223.86c-2.344-5.097-7.474-8.043-12.754-7.88"
        />
      </svg>
    </div>
    <div>{{ turn }}</div>
    <div class="pl-3 cursor-pointer" @click="nextCaptainTurn()">
      <svg
        viewBox="0 0 512 512"
        class="w-8 h-8 fill-teal-700"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M256 38.55c-30.5 0-55 24.52-55 55c0 30.45 24.5 54.95 55 54.95s55-24.5 55-54.95c0-30.48-24.5-55-55-55M191.3 164.4c-5.7 0-11.1.4-16 1.4c-19.9 4-34.1 15.6-43.1 35.4c-9.4 20.6-12.1 50.6-5.8 88l6 5.9c13.8 13.8 36.1 21.4 58.6 21.4c21.1 0 42.1-6.7 56-19V179.2c-21-9.8-39.8-14.5-55.7-14.8m129.4 0c-15.9.3-34.7 5-55.7 14.8v118.3c13.9 12.3 34.9 19 56 19c22.5 0 44.8-7.6 58.6-21.4l6-5.9c6.3-37.4 3.6-67.4-5.8-88c-9-19.8-23.2-31.4-43.1-35.4c-4.9-1-10.3-1.4-16-1.4m-209.1 14.4h-.2c-30 .7-55.2 12.1-70.2 32.1c-13.3 17.8-19.5 42.9-13.6 76c.9 5.1 2.1 10.5 3.7 16c24.5 18.5 54.3 18.6 78.9.3c-9.2-44.8-6.9-81.9 5.6-109.4q3.6-7.95 8.4-14.7c-2.9-.2-5.8-.3-8.6-.3h-3.9c-.1 0-.1-.1-.1 0m288.8 0c0-.1 0 0-.1 0h-3.9c-2.8 0-5.7.1-8.6.3q4.8 6.75 8.4 14.7c12.5 27.5 14.8 64.6 5.6 109.4c24.5 18.3 54.4 18.2 78.9-.3c1.5-5.5 2.8-10.9 3.7-16c5.9-33.1-.3-58.2-13.6-76c-15-20-40.2-31.4-70.2-32.1zM132.8 318.4c6.9 26.1 17.7 54.9 32.9 86.1h58.6l22.7-56.7v-28c-16.4 10-36.3 14.7-56 14.7c-20.7 0-41.5-5.2-58.2-16.1m246.4 0c-16.7 10.9-37.5 16.1-58.2 16.1c-19.7 0-39.6-4.7-56-14.7v28l22.7 56.7h58.6c15.2-31.2 26-60 32.9-86.1m-264.6 3.4c-23 13.9-50.1 16.1-74.5 6.4c9.6 23 24.1 48.5 44.5 76.3h61c-14-29.6-24.2-57.2-31-82.7m282.8 0c-6.8 25.5-17 53.1-31 82.7h61c20.4-27.8 34.9-53.3 44.5-76.3c-24.3 9.7-51.5 7.5-74.5-6.4M256 373.7l-22.1 55.4l22.1 44.3l22.1-44.3zM91.53 422.5l11.47 46h35.3l-23-23l23-23zm90.27 0l16.6 16.6l6.3 6.4l-23 23h51.7l-19.3-38.6l3-7.4zm113.1 0l1.5 3.7l1.5 3.7l-19.3 38.6h51.7l-23-23l23-23zm78.9 0l16.6 16.6l6.3 6.4l-23 23H409l11.5-46zM160 426.2l-19.3 19.3l19.3 19.3l19.3-19.3zm192 0l-19.3 19.3l19.3 19.3l19.3-19.3z"
        />
      </svg>
    </div>
    <div>{{ captainsTurn }}</div>
    <div class="pl-3" v-if="gameOver">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="w-8 h-8 fill-teal-700"
        viewBox="0 0 512 512"
      >
        <path
          d="M256 25c-11.594 0-23 12.8-23 31s11.406 31 23 31s23-12.8 23-31s-11.406-31-23-31m-103.951 2.975l-16.098 8.05c15.092 30.185 51.37 56.81 82.188 74.442L232.334 295H247V192h18v103h14.666l14.195-184.533c30.818-17.632 67.096-44.257 82.188-74.442l-16.098-8.05c-19.91 29.9-44.891 49.148-71.334 57.77C281.311 97.28 269.75 105 256 105s-25.31-7.72-32.617-19.256c-26.443-8.62-51.424-27.87-71.334-57.77zM169 313v96H25v78h462v-30H343V313z"
        />
      </svg>
    </div>
    <div
      :class="{
        'text-black': redScore != 0 && blueScore != 0,
        'text-code-red-700': redScore == 0,
        'text-code-blue-700': blueScore == 0,
      }"
    >
      {{ gameResult }}
    </div>
    <div class="flex-auto">
      <div class="flex justify-end -space-x-1.5">
        <div
          class="relative"
          v-bind:key="player.name"
          v-for="player in players"
        >
          <img
            class="inline-block w-16 h-16 p-1 rounded-full ring-2 shadow-md bg-white"
            :class="{
              'ring-gray-300': player.captain == 0,
              'ring-code-red-700': player.captain == 1,
              'ring-code-blue-700': player.captain == 2,
              'opacity-25': !player.online,
            }"
            :src="player.avatar"
            :alt="player.name"
          />
          <span
            v-show="player.captain != 0"
            class="absolute top-0 left-12 w-3.5 h-3.5 border-2 border-white rounded-full"
            :class="{
              'bg-code-red-700': player.captain == 1,
              'bg-code-blue-700': player.captain == 2,
            }"
          ></span>
        </div>
      </div>
    </div>
    <div class="pl-5">
      <router-link to="/">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-8 h-8 fill-teal-700"
          viewBox="0 0 512 512"
        >
          <path
            d="M217 28.098v455.804l142-42.597V70.697zm159.938 26.88l.062 2.327V87h16V55zM119 55v117.27h18V73h62V55zm258 50v16h16v-16zm0 34v236h16V139zm-240 58.727V233H41v46h96v35.273L195.273 256zM244 232c6.627 0 12 10.745 12 24s-5.373 24-12 24s-12-10.745-12-24s5.373-24 12-24M137 339.73h-18V448h18zM377 393v14h16v-14zm0 32v23h16v-23zM32 471v18h167v-18zm290.652 0l-60 18H480v-18z"
          />
        </svg>
      </router-link>
    </div>
  </div>
</template>
