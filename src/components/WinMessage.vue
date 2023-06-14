<script setup>
import { computed, toRefs  } from 'vue'

const props = defineProps({
  gameOver: {
    type: String,
    required: true
  },
  gameKey: String
})
</script>

<template>
  <div v-show="gameOver == 'none'">
    <img src="../assets/key.svg" />
    {{gameKey}}
  </div>
  <div v-show="gameOver == 'black'">
    Both teams lost
  </div>
  <div v-show="gameOver == 'red'">
    <span class="red">Red</span> team won
  </div>
  <div v-show="gameOver == 'blue'">
    <span class="blue">Blue</span> team won
  </div>
</template>

<style scoped>
div {
  font-family: var(--font-sans);
  font-size: 1.8vw;
  width: 100%;
  padding-left: 1rem;
}

img {
  height: 1.3rem;
}

.red {
  color: var(--vt-c-strawberry);
}

.blue {
  color: var(--vt-c-beril-blue);
}
</style>