<script setup>
import { SHA256 } from "crypto-es/lib/sha256";

import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const username = ref("");
const room = ref("");
const password = ref("");
const error = ref("");

const login = (e) => {
    if (username.value == "") {
        error.value = `Missing username`;
        return false;
    }
    if (room.value == "") {
        error.value = `Missing room`;
        return false;
    }
    if (password.value == "") {
        error.value = `Missing password`;
        return false;
    }

    if (
        SHA256(password.value).toString() != import.meta.env.VITE_KEY_CHECKSUM
    ) {
        error.value = `Invalid password`;
        return false;
    }

    error.value = "";
    // store values for connect
    localStorage.clear();
    localStorage.setItem("room", room.value);
    localStorage.setItem("username", username.value);
    localStorage.setItem("password", password.value);

    router.push(`/room/${room.value}`);
};

onMounted(() => {
    // remove old stored values
    console.debug("Home: onMounted");
    localStorage.clear();
});
</script>

<template>
    <div
        class="grid place-items-center h-screen bg-cover bg-center bg-no-repeat bg-login"
    >
        <div
            class="xl:w-1/4 lg:w-1/3 md:w-1/2 xl:h-2/3 lg:h-3/4 backdrop-blur-md bg-cyan-700/40 shadow-lg shadow-cyan-800/50 p-8 rounded-lg text-lg text-white font-sans"
        >
            <h1 class="text-3xl font-bold text-center mb-4">Login</h1>
            <h2
                class="text-xl font-bold text-center mb-4 text-red-400"
                v-show="error"
            >
                {{ error }}
            </h2>
            <form @submit.prevent="login">
                <div class="mb-4">
                    <label for="username" class="block mb-2">Username</label>
                    <input
                        type="text"
                        class="w-full px-4 py-2 border rounded-lg text-zinc-800"
                        placeholder="Username"
                        autocomplete="off"
                        id="username"
                        v-model.lazy.trim="username"
                    />
                </div>

                <div class="mb-4">
                    <label for="room" class="block mb-2">Room</label>
                    <input
                        type="text"
                        class="w-full px-4 py-2 border rounded-lg text-zinc-800"
                        placeholder="#"
                        autocomplete="off"
                        id="room"
                        v-model.lazy.trim="room"
                    />
                </div>

                <div class="mb-16">
                    <label for="password" class="block mb-2">Password</label>
                    <input
                        type="text"
                        class="w-full px-4 py-2 border rounded-lg text-zinc-800"
                        placeholder="Password"
                        autocomplete="off"
                        id="password"
                        v-model.lazy.trim="password"
                    />
                </div>

                <button
                    class="w-full bg-zinc-100 text-zinc-800 px-4 py-2 rounded-lg active:scale-[.97]"
                    role="button"
                >
                    Enter
                </button>
            </form>
        </div>
    </div>
</template>
