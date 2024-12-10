<script setup>
import { inject } from "vue";
import { storeToRefs } from "pinia";

import Toggle from "@/components/Toggle.vue";
import { useGameStore } from "@/stores/game.js";
import { usePlayersStore } from "@/stores/players.js";

const broker = inject("broker");
const { score } = storeToRefs(useGameStore());
const { isCaptainView } = usePlayersStore();
const toggleCaptain = () => {
    broker.toggleCaptain(!isCaptainView());
};
</script>

<template>
    <div class="grid grid-cols-5 gap-4 text-4xl">
        <div class="flex justify-center">
            <Toggle
                team="red"
                :isCaptainView="isCaptainView()"
                :toggleCaptain="toggleCaptain"
            />
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
            <Toggle
                team="blue"
                :isCaptainView="isCaptainView()"
                :toggleCaptain="toggleCaptain"
            />
        </div>
    </div>
</template>
