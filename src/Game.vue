<script setup>
import { onMounted, onUnmounted, inject } from "vue";
import { useRouter } from "vue-router";

import Info from "@/components/Info.vue";
import Controls from "@/components/Controls.vue";
import Screen from "@/components/Screen.vue";

const router = useRouter();
const broker = inject("broker");

onMounted(async () => {
    if (localStorage.getItem("loggedIn")) {
        console.log("this page was reloaded");
        localStorage.removeItem("loggedIn");
        router.push(`/`);
        return;
    }

    console.debug(`Game: onMounted`);
    localStorage.setItem("loggedIn", true);
    try {
        await broker.connect();
    } catch (error) {
        console.error(error);
        router.push(`/`);
    }
});

onUnmounted(() => {
    console.debug("Game: onUnmounted");
    if (localStorage.getItem("loggedIn")) {
        broker.disconnect();
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
