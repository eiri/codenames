<script setup lang="ts">
import { inject, computed } from "vue";
import { storeToRefs } from "pinia";

import Toggle from "@/components/Toggle.vue";
import { useGameStore } from "@/stores/game";
import { usePlayersStore } from "@/stores/players";

import { brokerKey, Broker } from "@/plugins/broker";

const broker = inject<Broker>(brokerKey);

const { seed, turn, redScore, blueScore } = storeToRefs(useGameStore());
const {
    isRedCaptain,
    isRedCaptainTaken,
    isBlueCaptain,
    isBlueCaptainTaken,
    nextCaptains,
} = usePlayersStore();

const toggleRedCaptain = () => {
    broker.setCaptain(isRedCaptain() ? 0 : 1);
};

const toggleBlueCaptain = () => {
    broker.setCaptain(isBlueCaptain() ? 0 : 2);
};

const captains = computed(() => nextCaptains(seed.value, turn.value));
</script>

<template>
    <div class="grid grid-cols-5 gap-4 text-4xl">
        <div class="flex flex-col items-center justify-center">
            <Toggle
                team="red"
                :disabled="isRedCaptainTaken() && !isRedCaptain()"
                :isCaptainView="isRedCaptain()"
                :toggleCaptain="toggleRedCaptain"
            />
            <div class="font-sans mt-2 text-base text-gray-700">
                {{ captains[0] }}
            </div>
        </div>
        <div class="flex justify-center text-code-red-700">
            {{ redScore }}
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
            {{ blueScore }}
        </div>
        <div class="flex flex-col items-center justify-center">
            <Toggle
                team="blue"
                :disabled="isBlueCaptainTaken() && !isBlueCaptain()"
                :isCaptainView="isBlueCaptain()"
                :toggleCaptain="toggleBlueCaptain"
            />
            <div class="font-sans mt-2 text-base text-gray-700">
                {{ captains[1] }}
            </div>
        </div>
    </div>
</template>
