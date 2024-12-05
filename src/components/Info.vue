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
    <div class="flex items-center text-2xl font-sans">
        <div class="flex-none">
            <img class="size-6" src="../assets/room.svg" />
        </div>
        <div class="flex-none pl-1">{{ room }}</div>
        <div class="flex-none pl-5">
            <img class="size-6" src="../assets/key.svg" />
        </div>
        <div class="flex-none pl-1">{{ gameKey }}</div>
        <div class="flex-auto">
            <div class="flex justify-end -space-x-1">
                <div
                    class="relative inline-block w-10 h-10 p-1 rounded-full ring-2 ring-gray-300 shadow-md bg-gradient-to-br from-transparent to-white text-center capitalize text-gray-600/80"
                    :style="{ 'background-color': player.color }"
                    v-for="player in players"
                >
                    {{ player.short }}
                </div>
            </div>
        </div>
        <div class="flex-none pl-5">
            <router-link to="/">
                <img class="size-6" src="../assets/logout.svg" />
            </router-link>
        </div>
    </div>
</template>
