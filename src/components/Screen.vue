<script setup>
import { storeToRefs } from "pinia";

import { useGameStore } from "@/stores/game.js";
import Card from "@/components/Card.vue";

const { board, score, gameOver } = storeToRefs(useGameStore());
</script>

<template>
    <div class="relative h-[70vh]">
        <div class="h-full w-full grid grid-cols-5 gap-12">
            <Card v-for="(card, i) in board" :key="i" :card="card" />
        </div>
        <div
            class="absolute top-0 left-0 w-full h-0 flex flex-col justify-center items-center bg-zinc-100 bg-opacity-90 backdrop-blur-sm"
            :class="{ 'h-full duration-500': gameOver != '' }"
        >
            <h1
                class="text-6xl"
                :class="{
                    'text-black': score.red != 0 && score.blue != 0,
                    'text-code-red-700': score.red == 0,
                    'text-code-blue-700': score.blue == 0,
                }"
            >
                {{ gameOver }}
            </h1>
        </div>
    </div>
</template>
