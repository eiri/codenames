<script setup>
import { inject } from "vue";
import { storeToRefs } from "pinia";

const broker = inject("broker");
import { useGameStore } from "@/stores/game.js";
import { usePlayersStore } from "@/stores/players.js";
import Card from "@/components/Card.vue";

const { board } = storeToRefs(useGameStore());
const { isCaptainView } = usePlayersStore();
const open = (idx) => {
    broker.open(idx);
};
</script>

<template>
    <div class="relative h-[63vh]">
        <div class="h-full w-full grid grid-cols-5 gap-12">
            <Card
                v-for="(card, i) in board"
                :key="i"
                :card="card"
                :isCaptainView="isCaptainView()"
                :open="open"
            />
        </div>
    </div>
</template>
