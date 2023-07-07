<script setup>
import { toRefs } from 'vue'

const props = defineProps({
  gameKey: {
    type: String,
    required: true
  }
})

const { gameKey } = toRefs(props)

</script>

<template>
  <div class="wrapper">
    <div class="left">
      <img class="key" src="../assets/key.svg" />
      {{gameKey}}
    </div>
    <div class="right">
      (U)
    </div>
    <div class="right">
      <router-link to="/">
        <img src="../assets/logout.svg" />
      </router-link>
    </div>
  </div>
</template>

<style scoped>
div.wrapper {
  display: grid;
  grid-template-columns: repeat(2, 1fr) 0.1fr;
  gap: 1rem;
}

.wrapper > div {
  display: flex;
  align-items: center;
  flex-direction: row;
  font-size: 1.6rem;
  line-height: 1.6rem;
}

img {
  width: 1.6rem;
  margin-right: 0.6rem;
}


.left {
  justify-content: left;
}

.right {
  justify-content: right;
}

</style>