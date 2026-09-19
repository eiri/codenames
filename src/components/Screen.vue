<script setup lang="ts">
import { inject } from "vue";
import { storeToRefs } from "pinia";

import Card from "@/components/Card.vue";
import { useGameStore } from "@/stores/game";
import { usePlayersStore } from "@/stores/players";
import { brokerKey } from "@/plugins/broker";

const broker = inject(brokerKey);
if (!broker) throw new Error("Missing broker provider");

const { board } = storeToRefs(useGameStore());
const { isCaptainView } = usePlayersStore();
const open = (idx: number) => {
  broker.open(idx);
};
</script>

<template>
  <div class="relative h-[55vh] min-h-80 sm:h-[60vh] md:h-[63vh]">
    <div
      class="grid h-full w-full grid-cols-5 gap-1 sm:gap-2 md:gap-4 lg:gap-8 xl:gap-12"
    >
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
