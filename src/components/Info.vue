<script setup>
import { ref } from "vue";
import { storeToRefs } from "pinia";

import { useGameStore } from "@/stores/game";
import { usePlayersStore } from "@/stores/players";

const room = ref(localStorage.getItem("room"));
const store = useGameStore();
const { gameKey } = storeToRefs(store);

const playersStore = usePlayersStore();
const { players } = storeToRefs(playersStore);
</script>

<template>
    <div class="flex items-center space-x-2 text-2xl font-sans">
        <div>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-8 h-8 fill-teal-700"
                viewBox="0 0 512 512"
            >
                <path
                    d="M105 41v398h302V41zm55 174c18.1 0 33 14.9 33 33s-14.9 33-33 33s-33-14.9-33-33s14.9-33 33-33m0 18c-8.4 0-15 6.6-15 15s6.6 15 15 15s15-6.6 15-15s-6.6-15-15-15M73 457v30h366v-30z"
                />
            </svg>
        </div>
        <div>{{ room }}</div>
        <div>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-8 h-8 fill-teal-700"
                viewBox="0 0 512 512"
            >
                <path
                    d="M261.1 24.8c-6.3 0-12.7.43-19.2 1.18c-34.6 4.01-64.8 17.59-86.1 37.06c-21.4 19.48-34.2 45.56-31 73.16c2.8 24.6 17.8 45.2 39.1 59.4c2.6-6.2 5.9-11.9 9.2-16.5c-17.6-11.6-28.4-27.3-30.4-45c-2.3-19.7 6.7-39.58 24.8-56.14c18.2-16.57 45.3-29.06 76.6-32.68c31.3-3.63 60.6 2.33 82.1 14.3c21.4 11.98 34.7 29.31 37 48.92c2.2 19.3-6.2 38.8-23.4 55a69.9 69.9 0 0 0-35.4-10.6h-2.2c-5.1.1-10.1.7-15.3 1.8c-37.5 8.7-60.8 45.5-52.2 82.7c5.3 23 21.6 40.6 42.2 48.5l39.7 172.2l47 29.1l29.5-46.7l-23.5-14.5l14.8-23.4l-23.5-14.6l14.7-23.3l-23.5-14.6l14.8-23.4l-13.5-58.4c15.1-16.1 22-39.1 16.7-62.2c-2.7-11.7-8.2-22-15.8-30.4c18.9-19 29.8-43.5 26.8-69.2c-3.2-27.55-21.6-50.04-46.9-64.11c-20.5-11.45-45.8-17.77-73.1-17.59m-20.2 135.5c-25.9 1.1-49.9 16.8-60.4 42.2c-9.1 21.9-6 45.7 6.2 64.2l-67.8 163l21.3 51l51.2-20.9l-10.7-25.5l25.6-10.4l-10.6-25.5l25.6-10.4l-10.7-25.5l25.6-10.5l22.8-54.8c-20.5-11.5-36.2-31.2-41.9-55.8c-6.9-30.3 3.1-60.6 23.8-81.1m58 7.2c8.9-.1 17.3 3.5 23.4 9.4c-5.5 3.5-11.6 6.6-18 9.4c-1.6-.6-3.3-.8-5.1-.8c-.6 0-1.1 0-1.6.1c-7 .8-12.2 6.1-13.1 12.7c-.2 1-.2 2-.2 2.9c.1.3.1.7.1 1c1 8.4 8.3 14.2 16.7 13.2c6.8-.8 12-5.9 13-12.3c6.2-2.8 12-5.9 17.5-9.4c.2 1 .4 2 .5 3c2.1 18-11 34.5-29 36.6c-17.9 2.1-34.5-11-36.5-29c-2.1-18 11-34.5 29-36.6c1.1-.1 2.2-.2 3.3-.2"
                />
            </svg>
        </div>
        <div>{{ gameKey }}</div>
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
