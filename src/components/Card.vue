<script setup>
import { computed, toRefs  } from 'vue'
import { storeToRefs  } from 'pinia'

import { CardState } from '../assets/states.js'
import { useGameStore } from '../stores/game.js'


const props = defineProps({
  card: {
    type: Object,
    required: true
  }
})

const { card } = toRefs(props);

const store = useGameStore()
const { isCaptain } = storeToRefs(store)
const { open } = store

const cardClass = computed(() => {
  if (!isCaptain.value && card.value.closed()) {
    return 'card-3'
  }
  return `card-${card.value.state} ${card.value.closed() ? '' : 'open'}`
})
</script>

<template>
  <article
    class="animate__animated"
    :class="[cardClass, {animate__flipInY: !card.closed()}]"
    @click="open(card.idx)"
  >
    <span>{{ card.word }}</span>
  </article>
</template>

<style scoped>
article {
  cursor: pointer;
  font-size: 2rem;
  height: 4.5rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  box-shadow: var(--box-shadow-low);
  transition: var(--animate-transition);
  display: flex;
  align-items: center;
  justify-content: center;
}

article:hover, .open {
  border: 1px solid var(--color-border-hover);
  box-shadow: var(--box-shadow-high);
}

/* black-open */
.card-0 {
  color: var(--color-text-light);
  background-color: var(--color-black);
}

/* black-open */
.card-1 {
  color: var(--color-text-dark);
  background-color: var(--color-black-light);
}

/* white-open */
.card-2 {
  color: var(--color-text-dark);
  background-color: var(--color-white);
}

/* white-closed */
.card-3 {
  color: var(--color-text-dark);
  background-color: var(--color-white-dark);
}

/* red-open */
.card-4 {
  color: var(--color-text-light);
  background-color: var(--color-red);
}

/* red-closed */
.card-5 {
  color: var(--color-text-light);
  background-color: var(--color-red-light);
}

/* blue-open */
.card-6 {
  color: var(--color-text-light);
  background-color: var(--color-blue);
}

/* blue-closed */
.card-7 {
  color: var(--color-text-dark);
  background-color: var(--color-blue-light);
}
</style>