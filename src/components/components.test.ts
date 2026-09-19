import { mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import { nextTick } from "vue";
import { describe, expect, it, vi } from "vitest";

import CardView from "@/components/Card.vue";
import Controls from "@/components/Controls.vue";
import Toggle from "@/components/Toggle.vue";
import { brokerKey } from "@/plugins/broker";
import rnd from "@/plugins/rnd";
import { Card, CardState, useGameStore } from "@/stores/game";

const makeRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/", component: { template: "<div />" } }],
  });

describe("Card", () => {
  it("opens a closed card once", async () => {
    const open = vi.fn();
    const card = new Card({ idx: 2, word: "test", state: CardState.WhiteClosed });
    const wrapper = mount(CardView, { props: { card, open } });

    await wrapper.trigger("click");
    expect(open).toHaveBeenCalledWith(2);

    card.state = CardState.WhiteOpened;
    await wrapper.setProps({ card });
    await wrapper.trigger("click");
    expect(open).toHaveBeenCalledOnce();
  });
});

describe("Toggle", () => {
  it("calls its typed callback unless disabled", async () => {
    const toggleCaptain = vi.fn();
    const wrapper = mount(Toggle, {
      props: { team: "red", toggleCaptain },
    });

    await wrapper.get("input").setValue(true);
    expect(toggleCaptain).toHaveBeenCalledOnce();

    await wrapper.setProps({ disabled: true });
    await wrapper.get("input").setValue(false);
    expect(toggleCaptain).toHaveBeenCalledOnce();
  });
});

describe("Controls", () => {
  it("labels new, active, and finished games", async () => {
    const pinia = createPinia();
    const broker = {
      nextGame: vi.fn(),
      nextCaptainsTurn: vi.fn(),
      setCaptain: vi.fn(),
    };
    const wrapper = mount(Controls, {
      global: {
        plugins: [rnd, pinia, makeRouter()],
        provide: { [brokerKey as symbol]: broker },
      },
    });
    const game = useGameStore(pinia);
    game.setSeed("test");
    await nextTick();

    expect(wrapper.get("button").text()).toBe("New game");

    const white = game.board.find((card) => card.state == CardState.WhiteClosed);
    game.open(white!.idx);
    await nextTick();
    expect(wrapper.get("button").text()).toBe("Restart game");

    const black = game.board.find((card) => card.state == CardState.BlackClosed);
    game.open(black!.idx);
    await nextTick();
    expect(wrapper.get("button").text()).toBe("New game");
  });
});
