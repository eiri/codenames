<script setup>
defineProps({
  word: {
    type: String,
    required: true
  }
})
</script>

<template>
  <span>{{ word }}</span>
</template>

<style scoped>
span {
}
</style>
