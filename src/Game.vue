<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

import { useGameStore } from '@/stores/game.js'
import Info from '@/components/Info.vue'
import Controls from '@/components/Controls.vue'
import Screen from '@/components/Screen.vue'


const router = useRouter()
const store = useGameStore()
const { connect, disconnect } = store

onMounted(() => {
  const username = localStorage.getItem("username")
  const room = localStorage.getItem("room")

  if (username == null || room == null) {
    console.error('missing username or room')
    router.push(`/`)
    return
  }

  console.debug(`Game: onMounted ${username} ${room}`)
  connect()
})

onUnmounted(() => {
  console.debug('Game: onUnmounted')
  disconnect()
  store.$reset()
})
</script>

<template>
  <header>
    <Info />
  </header>
  <main>
    <Screen />
  </main>
  <footer>
    <Controls />
  </footer>
</template>

<style scoped>
header, main, footer {
  padding: 1rem;
}

header {
  box-shadow: var(--box-shadow-low);
}

</style>