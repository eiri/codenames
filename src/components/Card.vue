<script setup>
import { computed, toRefs  } from 'vue'

const props = defineProps({
  card: {
    type: Object,
    required: true
  }
})

const { card } = toRefs(props);

const cardClass = computed(() => {
    return `${card.value.kind}-${card.value.opened ? 'open' : 'closed'}`
})

const flip = () => {
  card.value.opened = !card.value.opened
}
</script>

<template>
  <article :class="cardClass" @click="flip">
    <span>{{ card.word }}</span>
  </article>
</template>

<style scoped>
article {
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
}

.red-closed {
  color: var(--vt-c-white);
  background-color: var(--vt-c-peach);
}

.blue-open {
  color: var(--vt-c-white);
  background-color: var(--vt-c-beril-blue);
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