<script setup>
import { storeToRefs } from 'pinia'
import { useCounterStore } from '../stores/counter'

defineProps({
  msg: {
    type: String,
    required: true
  }
})

const store = useCounterStore()
const { count, doubleCount } = storeToRefs(store)
const { increment } = store
</script>

<template>
    <h1>{{ msg }}</h1>
    <div>
      Count: {{ count }} {{ doubleCount }}
    </div>
    <button @click="increment">Click</button>
</template>

<style scoped>
h1 {
  font-weight: 600;
  font-size: 36px;
}
</style>
