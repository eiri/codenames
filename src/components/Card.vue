<script setup lang="ts">
import { computed, toRefs } from "vue";

const props = defineProps({
    card: {
        type: Object,
        required: true,
    },
    isCaptainView: {
        type: Boolean,
    },
    open: {
        type: Function,
    },
});

const { card } = toRefs(props);

const open = () => {
    if (card.value.closed()) {
        props.open(card.value.idx);
    }
};

const cardClass = computed(() => {
    if (!props.isCaptainView && card.value.closed()) {
        return "card-3 shadow-md hover:shadow-xl";
    }
    return `card-${card.value.state} ${card.value.closed() ? "shadow-md hover:shadow-xl" : "shadow-xl"}`;
});
</script>

<template>
    <article
        class="animate__animated transition-transform duration-150 flex items-center justify-center text-4xl border border-zinc-400 rounded-md shadow-zinc-500/50"
        :class="[
            cardClass,
            { animate__flipInY: !card.closed() },
            { 'cursor-pointer': card.closed() },
        ]"
        @click="open()"
    >
        <span class="xl:text-4xl lg:text-2xl md:text-lg">{{ card.word }}</span>
    </article>
</template>

<style lang="postcss" scoped>
@reference "../assets/index.css";

/* black-open */
.card-0 {
    @apply text-white bg-zinc-950;
}

/* black-closed */
.card-1 {
    @apply text-white bg-zinc-950/50;
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
