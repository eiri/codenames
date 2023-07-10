<script setup>
import { toRefs } from 'vue'

const props = defineProps({
  gameKey: {
    type: String,
    required: true
  },
  players: Object,
})

const { gameKey, players } = toRefs(props)

</script>

<template>
  <div class="wrapper">
    <div class="left">
      <img class="key" src="../assets/key.svg" />
      {{gameKey}}
    </div>
    <div class="right avatars">
      <div
        class="avatar__item"
        v-for="player in players"
      >
        <div class="avatar" :style="{'background-color': player.color}">
          {{ player.short }}
        </div>
      </div>
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

.avatars {
  display: flex;
}

.avatar__item {
  margin-left: -0.25rem;
}

.avatar {
  box-shadow: 0 0 0 0.25rem var(--color-white);

  align-items: center;
  display: flex;
  justify-content: center;

  font-family: var(--font-sans);
  text-transform: capitalize;
  height: 2.4rem;
  width: 2.4rem;
  border: 1px solid var(--color-border);
  border-radius: 50%;
}
</style>
