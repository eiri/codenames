import { mount, flushPromises } from "@vue/test-utils";
import { createPinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import Home from "@/Home.vue";
import Game from "@/Game.vue";
import { brokerKey } from "@/plugins/broker";
import { useSessionStore } from "@/stores/session";
import { useGameStore } from "@/stores/game";

const makeRouter = () => createRouter({
  history: createMemoryHistory(),
  routes: ["/", "/room/:room"].map((path) => ({ path, component: { template: "<div />" } })),
});
const json = (data: unknown) => new Response(JSON.stringify(data), {
  headers: { "Content-Type": "application/json" },
});

afterEach(() => { vi.unstubAllGlobals(); });

describe("browser authentication", () => {
  it("submits the password to the server without trimming or storing it", async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(json({ username: null }))
      .mockResolvedValueOnce(json({ username: "Eiri" }));
    vi.stubGlobal("fetch", fetch);
    const pinia = createPinia();
    const router = makeRouter();
    await router.push("/");
    const wrapper = mount(Home, { global: { plugins: [pinia, router] } });
    await flushPromises();
    await wrapper.get('img[alt="Eiri"]').trigger("click");
    expect(wrapper.get("#password").attributes("type")).toBe("password");
    await wrapper.get("#password").setValue(" password with spaces ");
    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(fetch).toHaveBeenLastCalledWith("/api/login", expect.objectContaining({
      credentials: "same-origin",
      body: JSON.stringify({ username: "Eiri", password: " password with spaces " }),
    }));
    expect(router.currentRoute.value.fullPath).toBe("/room/212");
    expect(useSessionStore(pinia).username).toBe("Eiri");
    expect((wrapper.get("#password").element as HTMLInputElement).value).toBe("");
    wrapper.unmount();
  });

  it("restores a room session and logs out only this browser", async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(json({ username: "Eiri" }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetch);
    const pinia = createPinia();
    const router = makeRouter();
    await router.push("/room/212");
    const broker = { connect: vi.fn(), disconnect: vi.fn() };
    const wrapper = mount(Game, {
      global: { plugins: [pinia, router], provide: { [brokerKey as symbol]: broker } },
    });
    await flushPromises();
    expect(wrapper.text()).toContain("212");
    expect(broker.connect).toHaveBeenCalledWith("212", "Eiri");

    // Pending commands must not insert a status line that moves the board.
    const game = useGameStore(pinia);
    game.connected = true;
    await flushPromises();
    expect(wrapper.get('[role="status"]').text()).toBe("");
    game.pending = true;
    await flushPromises();
    expect(wrapper.get('[role="status"]').text()).toBe("");
    expect(wrapper.get("main").attributes("aria-busy")).toBe("true");
    game.pending = false;

    await wrapper.get('button[aria-label="Log out"]').trigger("click");
    await flushPromises();

    expect(broker.disconnect).toHaveBeenCalledOnce();
    expect(fetch).toHaveBeenLastCalledWith("/api/logout", expect.objectContaining({ method: "POST" }));
    expect(useSessionStore(pinia).username).toBe("");
    expect(router.currentRoute.value.fullPath).toBe("/");
    wrapper.unmount();
  });
});
