<script setup lang="ts">
import { computed, toRefs } from "vue";

import type { Card } from "@/stores/game";

interface Props {
  card: Card;
  isCaptainView?: boolean;
  open: (idx: number) => void;
}

const props = defineProps<Props>();

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
    class="animate__animated flex items-center justify-center overflow-hidden rounded-md border border-zinc-400 px-1 text-center shadow-zinc-500/50 transition-transform duration-150"
    :class="[
      cardClass,
      { animate__flipInY: !card.closed() },
      { 'cursor-pointer': card.closed() },
    ]"
    @click="open()"
  >
    <span
      class="break-words text-[0.6rem] leading-tight sm:text-xs md:text-base lg:text-xl xl:text-3xl"
    >
      {{ card.word }}
    </span>
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
