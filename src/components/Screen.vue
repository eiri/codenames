<script setup lang="ts">
import { inject } from "vue";
import { storeToRefs } from "pinia";

import Card from "@/components/Card.vue";
import { useGameStore } from "@/stores/game";
import { usePlayersStore } from "@/stores/players";
import { brokerKey, Broker } from "@/plugins/broker";

const broker = inject<Broker>(brokerKey);

const { board } = storeToRefs(useGameStore());
const { isCaptainView } = usePlayersStore();
const open = (idx: number) => {
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
