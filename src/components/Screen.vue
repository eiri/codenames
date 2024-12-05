<script setup>
import { storeToRefs } from "pinia";

import { useGameStore } from "@/stores/game.js";
import Card from "@/components/Card.vue";

const store = useGameStore();
const { board } = storeToRefs(store);
</script>

<template>
    <div class="grid grid-cols-5 gap-12 h-[75vh]">
        <Card v-for="(card, i) in board" :key="i" :card="card" />
    </div>
</template>
