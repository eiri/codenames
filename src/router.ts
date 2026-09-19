import { createRouter, createWebHashHistory } from "vue-router";

import Home from "@/Home.vue";
import Game from "@/Game.vue";

export const routes = [
  { path: "/", component: Home },
  { path: "/room/:room", component: Game },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
});
