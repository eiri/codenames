<script setup>
import { computed, toRefs, inject } from "vue";

import { usePlayersStore } from "@/stores/players.js";

const props = defineProps({
    card: {
        type: Object,
        required: true,
    },
});

const { card } = toRefs(props);

const broker = inject("broker");
const { isCaptainView } = usePlayersStore();

const open = (idx) => {
    if (card.value.closed()) {
        broker.open(idx);
    }
};

const cardClass = computed(() => {
    if (!isCaptainView() && card.value.closed()) {
        return "card-3 shadow-md hover:shadow-xl";
    }
    return `card-${card.value.state} ${card.value.closed() ? "shadow-md hover:shadow-xl" : "shadow-xl"}`;
});
</script>

<template>
    <article
        class="animate__animated transition-transform duration-150 cursor-pointer flex items-center justify-center text-4xl border border-zinc-400 rounded-md shadow-zinc-500/50"
        :class="[cardClass, { animate__flipInY: !card.closed() }]"
        @click="open(card.idx)"
    >
        <span class="xl:text-4xl lg:text-2xl md:text-lg">{{ card.word }}</span>
    </article>
</template>

<style lang="postcss" scoped>
/* black-open */
.card-0 {
    @apply text-white bg-zinc-950;
}

/* black-closed */
.card-1 {
    @apply text-zinc-900 bg-zinc-950/20;
}

/* white-open */
.card-2 {
    @apply text-zinc-900 bg-white;
}

/* white-closed */
.card-3 {
    @apply text-zinc-900 bg-ivory;
}

/* red-open */
.card-4 {
    @apply text-white bg-code-red-700;
}

/* red-closed */
.card-5 {
    @apply text-zinc-900 bg-code-red-300;
}

/* blue-open */
.card-6 {
    @apply text-white bg-code-blue-700;
}

/* blue-closed */
.card-7 {
    @apply text-zinc-900 bg-code-blue-300;
}
</style>
