<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const username = ref('')
const room = ref('')
const password = ref('')
const error = ref(false)

const login = (e) => {
  if (room.value == '' || username.value == '' || password.value == '') {
    error.value = true
    return false
  }
  error.value = false
  // store values for connect
  localStorage.setItem("room", room.value)
  localStorage.setItem("username", username.value)
  localStorage.setItem("password", password.value)
  router.push(`/game/${room.value}`)
}

onMounted(() => {
  // remove old stored values
  localStorage.clear()
})
</script>

<template>
  <div class="overlay">
    <form @submit.prevent="login">
        <h1 :class="{error: error}">Login</h1>

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
  /* https://unsplash.com/collections/9568420/letter-love */
  /*background-image: url('https://source.unsplash.com/collection/9568420/');*/
  background-image: url('assets/bg.jpg');
  background-color: rgba(0, 0, 0, 1);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.error {
  color: var(--color-red-light);
}

h1 {
  text-align: center;
}

form {
  width: 20vw;
  height: 60vh;
  position: absolute;
  transform: translate(-50%,-50%);
  top: 50%;
  left: 50%;
  border-radius: 10px;
  background-color: rgba(111, 161, 187, 0.4);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: var(--box-shadow-high);
  padding: 2rem 1rem;
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
  width: 19vw;
  height: 3rem;
  display: block;
  background-color: rgba(111, 161, 187, 0.7);
  border-radius: 4px;
  padding: 0 0.5rem;
}

::placeholder {
  color: var(--color-background);
  opacity: 0.6
}

button {
  width: 20vw;
  height: 3rem;
  margin-top: 6rem;
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