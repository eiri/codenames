import { describe, expect, it } from "vitest";

import Game from "@/Game.vue";
import Home from "@/Home.vue";
import { routes } from "@/router";

describe("routes", () => {
  it("maps home and room URLs", () => {
    expect(routes).toEqual([
      { path: "/", component: Home },
      { path: "/room/:room", component: Game },
    ]);
  });
});
