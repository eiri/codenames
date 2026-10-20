<script setup lang="ts">
import { inject } from "vue";
import { storeToRefs } from "pinia";

import Toggle from "@/components/Toggle.vue";
import { useGameStore } from "@/stores/game";
import { usePlayersStore } from "@/stores/players";
import { Captain } from "@/game/types";
import { brokerKey } from "@/plugins/broker";

const broker = inject(brokerKey);
if (!broker) throw new Error("Missing broker provider");

const { redScore, blueScore, canMutate } =
  storeToRefs(useGameStore());
const { captains, isRedCaptain, isBlueCaptain } = storeToRefs(usePlayersStore());

const toggleRedCaptain = () => {
  broker.setCaptain(isRedCaptain.value ? Captain.None : Captain.Red);
};

const toggleBlueCaptain = () => {
  broker.setCaptain(isBlueCaptain.value ? Captain.None : Captain.Blue);
};

</script>

<template>
  <div class="grid grid-cols-5 gap-4 text-4xl">
    <div class="flex flex-col items-center justify-center">
      <Toggle
        team="red"
        :captain="captains[0]"
        :disabled="!canMutate"
        :isCaptainView="isRedCaptain"
        :toggleCaptain="toggleRedCaptain"
      />
    </div>
    <div class="flex justify-center text-code-red-700">
      {{ redScore }}
    </div>
    <div class="flex justify-center">
      <button
        class="w-2/3 h-12 px-4 py-0 bg-teal-700 shadow-lg shadow-teal-500/50 text-white rounded-md cursor-pointer active:scale-[.97] font-sans xl:text-2xl lg:text-xl md:text-sm"
        :disabled="!canMutate"
        @click="broker.nextGame()"
      >
        New game
      </button>
    </div>
    <div class="flex justify-center text-code-blue-700">
      {{ blueScore }}
    </div>
    <div class="flex flex-col items-center justify-center">
      <Toggle
        team="blue"
        :captain="captains[1]"
        :disabled="!canMutate"
        :isCaptainView="isBlueCaptain"
        :toggleCaptain="toggleBlueCaptain"
      />
    </div>
  </div>
</template>
