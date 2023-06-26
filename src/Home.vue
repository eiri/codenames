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
          placeholder="Room #"
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
  color: var(--vt-c-peach);
}

form {
  height: 32rem;
  width: 24rem;
  position: absolute;
  transform: translate(-50%,-50%);
  top: 50%;
  left: 50%;
  border-radius: 10px;
  background-color: rgba(111, 161, 187, 0.4);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 0 40px rgba(8,7,16,0.6);
  padding: 2rem 1rem;
}

form * {
  font-family: var(--font-sans);
  color: var(--color-background-mute);
  letter-spacing: 0.5px;
  outline: none;
  border: none;
}

form h1 {
  font-family: var(--font-sans);
  font-size: 1.4vw;
  text-align: center;
}

label {
  display: block;
  font-size: 1vw;
  margin-top: 1rem;
}

input {
  display: block;
  height: 3rem;
  width: 22rem;
  font-size: 1vw;
  background-color: rgba(111, 161, 187, 0.7);
  border-radius: 3px;
  padding: 0 1rem;
  margin-top: 0.6rem;
}

::placeholder {
  color: var(--color-background-mute);
}

button {
  font-size: 1.1vw;
  height: 3rem;
  width: 24rem;
  margin-top: 6rem;
  color: var(--color-text);
  background-color: var(--color-background);
  border-radius: 5px;
  box-shadow: 2px 4px 4px 2px rgba(0,0,0,0.3);
}

button:focus {
  box-shadow: 2px 4px 4px 2px rgba(0,0,0,0.3);
}

button:active {
  box-shadow: 2px 4px 2px 1px rgba(0,0,0,0.5);
  transform: translateY(2px);
}
</style>