<script setup>
import { computed, toRefs  } from 'vue'
import { storeToRefs  } from 'pinia'

import { CardState } from '../assets/states.js'
import { useGameStore } from '../stores/game'


const props = defineProps({
  card: {
    type: Object,
    required: true
  }
})

const { card } = toRefs(props);

const store = useGameStore()
const { subscribed, captainView } = storeToRefs(store)
const { open } = store

const cardClass = computed(() => {
  if (!captainView.value && card.value.closed()) {
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
    <span :class="{blur: !subscribed}">{{ card.word }}</span>
  </article>
</template>

<style scoped>
article {
  cursor: pointer;
  height: 5rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
  transition: 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2vw;
}

article:hover, .open {
  box-shadow: 0 8px 16px 0 rgba(0, 0, 0, 0.3);
}

.blur {
  filter: blur(8px);
}

/* black-open */
.card-0 {
  color: var(--vt-c-white);
  background-color: var(--vt-c-black);
}

/* black-open */
.card-1 {
  color: var(--vt-c-white);
  background-color: var(--vt-c-text-light-2);
}

/* white-open */
.card-2 {
  color: var(--vt-c-black);
  background-color: var(--vt-c-white);
}

/* white-closed */
.card-3 {
  color: var(--vt-c-black);
  background-color: var(--vt-c-lilac);
}

/* white-open */
.card-4 {
  color: var(--vt-c-white);
  background-color: var(--vt-c-strawberry);
}

/* red-closed */
.card-5 {
  color: var(--vt-c-white);
  background-color: var(--vt-c-peach);
}

/* blue-open */
.card-6 {
  color: var(--vt-c-white);
  background-color: var(--vt-c-beril-blue);
}

/* blue-closed */
.card-7 {
  color: var(--vt-c-black);
  background-color: var(--vt-c-baby-blue);
}
</style>