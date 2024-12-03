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
    <div class="overlay">
        <form @submit.prevent="login">
            <h1 v-show="error == ''">Login</h1>
            <h1 v-show="error" class="error">{{ error }}</h1>

            <label for="username">Username</label>
            <input
                type="text"
                placeholder="Username"
                autocomplete="off"
                id="username"
                v-model.lazy.trim="username"
            />

            <label for="room">Room</label>
            <input
                type="text"
                placeholder="#"
                autocomplete="off"
                id="room"
                v-model.lazy.trim="room"
            />

            <label for="password">Password</label>
            <input
                type="text"
                placeholder="Password"
                autocomplete="off"
                id="password"
                v-model.lazy.trim="password"
            />

            <button role="button">Enter</button>
        </form>
    </div>
</template>

<style scoped>
.overlay {
    position: fixed;
    width: 100%;
    height: 100%;
    left: 0;
    top: 0;
    z-index: 10;
    background-image: url("assets/bg.jpg");
    background-color: rgba(0, 0, 0, 1);
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;

    display: flex;
    align-items: top;
    justify-content: center;
}

.error {
    color: var(--color-red-light);
}

h1 {
    text-align: center;
}

form {
    width: 380px;
    position: absolute;
    top: 2vh;
    padding: 1rem;
    border-radius: 10px;
    background-color: rgba(111, 161, 187, 0.4);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    box-shadow: var(--box-shadow-high);
}

form * {
    font-size: 1.2rem;
    font-family: var(--font-sans);
    color: var(--color-background);
    letter-spacing: 0.5px;
    outline: none;
    border: none;
}

label {
    display: block;
    margin: 2rem 0rem 1rem;
}

input {
    width: 100%;
    height: 3rem;
    padding: 0 0.5rem;
    background-color: rgba(111, 161, 187, 0.7);
    border-radius: 4px;
    box-sizing: border-box;
    resize: vertical;
}

::placeholder {
    color: var(--color-background);
    opacity: 0.6;
}

button {
    width: 100%;
    height: 3rem;
    margin-top: 3rem;
    margin-bottom: 3rem;
    color: var(--color-text-dark);
    background-color: var(--color-background);
    border-radius: 4px;
    box-shadow: var(--box-shadow-high);
}

button:active {
    box-shadow: var(--box-shadow-low);
    transform: translateY(2px);
}
</style>
