<script setup>
import { ref, inject } from "vue";
import { storeToRefs } from "pinia";

const broker = inject("broker");
import { useGameStore } from "@/stores/game";
import { usePlayersStore } from "@/stores/players";

const room = ref(localStorage.getItem("room"));
const store = useGameStore();
const { turn, score, gameOver } = storeToRefs(store);

const playersStore = usePlayersStore();
const { players } = storeToRefs(playersStore);
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
                    d="M229.832 24.166C169.087 23.868 108.817 50.45 68.12 101.72c-70.4 88.68-55.578 217.634 33.1 288.032a174 174 0 0 0 4.26 3.27c.286.303.575.618.86.916c-.118-.177-.23-.355-.348-.532c5.055 3.744 10.36 7.29 15.504 10.475a204.3 204.3 0 0 1-36.783-50.52c-26.065-64.267-15.236-129.285 32.96-161.24c58.434-38.76 151.118-15.176 215.06 51.675c-3.942-5.902-8.413-12.113-13.016-17.834c-63.682-79.235-166.368-109.6-229.362-67.817c-1.072.71-2.122 1.442-3.158 2.185a205.7 205.7 0 0 1 18.953-28.418c65.31-82.274 181.148-100.695 268.36-46.756c-5.63-5.66-11.95-11.454-18.358-16.54c-37.412-29.7-81.992-44.23-126.32-44.448zm160.617 82.277c45.104 42.614 67.29 102.166 63.886 161.223c-5.603 29.51-20.302 57.597-44.16 80.174c-58.436 55.31-151.12 57.978-215.063 9.238c3.944 4.784 8.413 9.73 13.016 14.145c49.375 47.45 122.196 58.87 181.786 33.818c-65.28 61.195-164.122 72.983-242.467 27.83c5.804 5.48 12.3 11.075 18.863 15.96c90.822 67.61 219.257 48.797 286.867-42.03c67.61-90.822 48.795-219.255-42.028-286.866c-6.56-4.887-13.782-9.5-20.703-13.49z"
                />
            </svg>
        </div>
        <div>
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
                'text-black': score.red != 0 && score.blue != 0,
                'text-code-red-700': score.red == 0,
                'text-code-blue-700': score.blue == 0,
            }"
        >
            {{ gameOver }}
        </div>
        <div class="flex-auto">
            <div class="flex justify-end -space-x-1.5">
                <div class="relative" v-for="player in players">
                    <img
                        class="inline-block w-16 h-16 p-1 rounded-full ring-2 shadow-md bg-white"
                        :class="{
                            'ring-gray-300': player.captain == 0,
                            'ring-code-red-700': player.captain == 1,
                            'ring-code-blue-700': player.captain == 2,
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
