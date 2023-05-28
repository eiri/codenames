<script setup>
import Screen from './components/Screen.vue'
import Score from './components/Score.vue'
</script>

<template>
  <main>
    <Screen />
  </main>
  <footer>
    <Score />
  </footer>
</template>

<style scoped>
header, main, footer {
  padding: 0.5rem;
}
</style>