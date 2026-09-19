import "@/assets/index.css";

import { createApp } from "vue";
import { createPinia } from "pinia";

import rnd from "@/plugins/rnd";
import broker from "@/plugins/broker";
import { router } from "@/router";
import App from "@/App.vue";

const pinia = createPinia();

const app = createApp(App);
app.use(router);
app.use(pinia);
app.use(rnd);
app.use(broker);

app.mount("#app");
