<script setup lang="ts">
import { onMounted, onUnmounted, inject } from "vue";
import { useRouter } from "vue-router";

import Info from "@/components/Info.vue";
import Controls from "@/components/Controls.vue";
import Screen from "@/components/Screen.vue";
import { brokerKey, Broker } from "@/plugins/broker";

const router = useRouter();
const broker = inject<Broker>(brokerKey);

onMounted(async () => {
  console.debug(`Game: onMounted`);
  try {
    await broker.connect();
    localStorage.setItem("loggedIn", "true");
  } catch (error) {
    console.error(error);
    router.push(`/`);
  }
});

onUnmounted(async () => {
  console.debug("Game: onUnmounted");
  if (localStorage.getItem("loggedIn")) {
    await broker.disconnect();
    localStorage.removeItem("loggedIn");
  }
});
</script>

<template>
  <header class="p-4 shadow-md">
    <Info />
  </header>
  <main class="p-4">
    <Screen />
  </main>
  <footer class="pt-12">
    <Controls />
  </footer>
</template>
