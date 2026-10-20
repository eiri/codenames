<script setup lang="ts">
import { computed, toRefs } from "vue";

import type { CardSnapshot } from "@/game/snapshot";

interface Props {
  card: CardSnapshot;
  disabled?: boolean;
  open: (idx: number) => void;
}

const props = defineProps<Props>();

const { card } = toRefs(props);

const open = () => {
  if (!props.disabled && !card.value.open) {
    props.open(card.value.idx);
  }
};

const cardClass = computed(() => {
  const colors = { black: 0, white: 2, red: 4, blue: 6 };
  const state = card.value.color == null ? 3 : colors[card.value.color] + (card.value.open ? 0 : 1);
  return `card-${state} ${card.value.open ? "shadow-xl" : "shadow-md hover:shadow-xl"}`;
});
</script>

<template>
  <article
    class="animate__animated flex items-center justify-center overflow-hidden rounded-md border border-zinc-400 px-1 text-center shadow-zinc-500/50 transition-transform duration-150"
    :class="[
      cardClass,
      { animate__flipInY: card.open },
      { 'cursor-pointer': !card.open && !disabled },
    ]"
    @click="open()"
  >
    <span
      class="wrap-break-words text-[0.6rem] leading-tight sm:text-xs md:text-base lg:text-xl xl:text-3xl"
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
