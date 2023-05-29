<script setup>
import { computed, toRefs  } from 'vue'
import { storeToRefs  } from 'pinia'

import { useGameStore } from '../stores/game'


const props = defineProps({
  card: {
    type: Object,
    required: true
  }
})

const { card } = toRefs(props);

const store = useGameStore()
const { captainView } = storeToRefs(store)
const { open } = store

const cardClass = computed(() => {
  let kind = (captainView.value || card.value.opened) ?  card.value.kind : 'white'
  let mod = card.value.opened ? 'open' : 'closed'
  return `${kind}-${mod}`
})
</script>

<template>
  <article
    class="animate__animated"
    :class="[cardClass, {animate__flipInY: card.opened}]"
    @click="open(card.idx)"
  >
    <span>{{ card.word }}</span>
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

article:hover {
  box-shadow: 0 8px 16px 0 rgba(0, 0, 0, 0.3);
}

.red-open {
  color: var(--vt-c-white);
  background-color: var(--vt-c-strawberry);
  box-shadow: 0 8px 16px 0 rgba(0, 0, 0, 0.3);
}

.red-closed {
  color: var(--vt-c-white);
  background-color: var(--vt-c-peach);
}

.blue-open {
  color: var(--vt-c-white);
  background-color: var(--vt-c-beril-blue);
  box-shadow: 0 8px 16px 0 rgba(0, 0, 0, 0.3);
}

.blue-closed {
  color: var(--vt-c-black);
  background-color: var(--vt-c-baby-blue);
}

.black-open {
  color: var(--vt-c-white);
  background-color: var(--vt-c-black);
}

.black-closed {
  color: var(--vt-c-white);
  background-color: var(--vt-c-text-light-2);
}

.white-open {
  color: var(--vt-c-black);
  background-color: var(--vt-c-white);
}

.white-closed {
  color: var(--vt-c-black);
  background-color: var(--vt-c-lilac);
}
</style>