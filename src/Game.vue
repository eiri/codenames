<script setup lang="ts">
import { onMounted, onUnmounted, inject, ref } from "vue";
import { onBeforeRouteUpdate, useRoute, useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import Info from "@/components/Info.vue";
import Screen from "@/components/Screen.vue";
import Controls from "@/components/Controls.vue";
import { brokerKey } from "@/plugins/broker";
import { useSessionStore } from "@/stores/session";
import { useGameStore } from "@/stores/game";

const route = useRoute();
const router = useRouter();
const broker = inject(brokerKey);
if (!broker) throw new Error("Missing broker provider");

const session = useSessionStore();
const { connected, pending, error } = storeToRefs(useGameStore());
const ready = ref(false);
let active = true;

const logout = async () => {
  broker.disconnect();
  try {
    await session.logout();
    await router.push("/");
  } catch {
    error.value = "Logout failed. Try again";
  }
};

onMounted(async () => {
  try {
    await session.restore();
    if (!active) return;
    const room = String(route.params.room ?? "");
    if (!session.username || !/^[A-Za-z0-9_-]{1,32}$/.test(room)) {
      await router.replace("/");
      return;
    }
    broker.connect(room, session.username);
    ready.value = true;
  } catch {
    error.value = "Cannot restore the session. Reload to try again";
  }
});

onBeforeRouteUpdate((to) => {
  if (!ready.value) return;
  const room = String(to.params.room ?? "");
  if (!/^[A-Za-z0-9_-]{1,32}$/.test(room)) return "/";
  broker.connect(room, session.username);
});

onUnmounted(() => {
  active = false;
  broker.disconnect();
});
</script>

<template>
  <header v-if="ready" class="p-2 shadow-md sm:p-4">
    <Info @logout="logout" />
  </header>
  <p class="px-4 font-sans" role="status">
    {{ error || (!connected ? "Disconnected. Waiting for the room..." : "") }}
  </p>
  <main class="p-2 sm:p-4" :aria-busy="pending"><Screen /></main>
  <footer v-if="ready" class="px-2 pt-6 sm:px-4 sm:pt-12"><Controls /></footer>
</template>
