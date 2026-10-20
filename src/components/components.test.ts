import { mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import { nextTick } from "vue";
import { describe, expect, it, vi } from "vitest";
import CardView from "@/components/Card.vue";
import Controls from "@/components/Controls.vue";
import Toggle from "@/components/Toggle.vue";
import Info from "@/components/Info.vue";
import { brokerKey } from "@/plugins/broker";
import { GameResult, useGameStore } from "@/stores/game";
import { usePlayersStore } from "@/stores/players";
import { Captain } from "@/game/types";
import { roomSnapshot } from "@/test/fixtures";
import type { CardSnapshot } from "@/game/snapshot";

describe("Card", () => {
  it("shows hidden colors safely and opens only closed, enabled cards", async () => {
    const open = vi.fn();
    const card: CardSnapshot = { idx: 2, word: "test", open: false, color: null };
    const wrapper = mount(CardView, { props: { card, open } });
    expect(wrapper.classes()).toContain("card-3");
    await wrapper.trigger("click");
    expect(open).toHaveBeenCalledWith(2);
    await wrapper.setProps({ disabled: true });
    await wrapper.trigger("click");
    await wrapper.setProps({ card: { ...card, open: true, color: "white" }, disabled: false });
    await wrapper.trigger("click");
    expect(open).toHaveBeenCalledOnce();
    expect(wrapper.classes()).toContain("card-2");
  });
});

describe("Toggle", () => {
  it("keeps its appearance until the server changes the selected role", async () => {
    for (const team of ["red", "blue"] as const) {
      const toggleCaptain = vi.fn();
      const wrapper = mount(Toggle, { props: { team, isCaptainView: true, toggleCaptain } });
      const track = wrapper.get("div.relative");
      const selected = track.classes();
      expect(selected).toContain(`bg-code-${team}-700`);

      await wrapper.setProps({ disabled: true });
      expect(track.classes()).toEqual(selected);
      expect(wrapper.get("input").attributes("disabled")).toBeDefined();
      await wrapper.setProps({ disabled: false });
      await wrapper.get("input").setValue(false);
      expect(toggleCaptain).toHaveBeenCalledOnce();
      expect(track.classes()).toEqual(selected);

      await wrapper.setProps({ isCaptainView: false });
      const unselected = track.classes();
      expect(unselected).toContain("bg-zinc-400");
      await wrapper.setProps({ disabled: true });
      expect(track.classes()).toEqual(unselected);
      wrapper.unmount();
    }
  });

  it("calls its callback unless disabled", async () => {
    const toggleCaptain = vi.fn();
    const wrapper = mount(Toggle, { props: { team: "red", toggleCaptain } });
    await wrapper.get("input").setValue(true);
    expect(toggleCaptain).toHaveBeenCalledOnce();
    await wrapper.setProps({ disabled: true });
    await wrapper.get("input").setValue(false);
    expect(toggleCaptain).toHaveBeenCalledOnce();
  });
});

describe("Info", () => {
  it("keeps the left icon decorative and logs out from the rightmost icon", async () => {
    const pinia = createPinia();
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: "/", component: { template: "<div />" } }],
    });
    const broker = { newShuffle: vi.fn(), nextCaptainsTurn: vi.fn() };
    const wrapper = mount(Info, { global: {
      plugins: [pinia, router], provide: { [brokerKey as symbol]: broker },
    } });
    const shuffle = wrapper.get('button[aria-label="New shuffle"]');
    expect(shuffle.attributes("disabled")).toBeDefined();
    await shuffle.trigger("click");
    expect(broker.newShuffle).not.toHaveBeenCalled();

    useGameStore(pinia).connected = true;
    await nextTick();
    await shuffle.trigger("click");
    expect(broker.newShuffle).toHaveBeenCalledOnce();

    const icons = [shuffle, wrapper.get('button[aria-label="Advance captain suggestions"]')];
    const classes = icons.map((icon) => icon.classes());
    useGameStore(pinia).pending = true;
    await nextTick();
    icons.forEach((icon, idx) => {
      expect(icon.attributes("disabled")).toBeDefined();
      expect(icon.classes()).toEqual(classes[idx]);
      expect(icon.classes().some((name) => name.includes("opacity"))).toBe(false);
    });
    useGameStore(pinia).pending = false;
    await nextTick();
    expect(wrapper.element.firstElementChild).toBe(wrapper.get('div[aria-hidden="true"]').element);
    await wrapper.get('div[aria-hidden="true"]').trigger("click");
    expect(wrapper.emitted("logout")).toBeUndefined();
    await wrapper.get('button[aria-label="Advance captain suggestions"]').trigger("click");
    expect(broker.nextCaptainsTurn).toHaveBeenCalledOnce();
    const logout = wrapper.get('button[aria-label="Log out"]');
    expect(logout.element.parentElement).toBe(wrapper.element.lastElementChild);
    await logout.trigger("click");
    expect(wrapper.emitted("logout")).toHaveLength(1);
  });
});

describe("Controls", () => {
  it("offers separate red and blue self-selection switches", async () => {
    const pinia = createPinia();
    const broker = { setCaptain: vi.fn() };
    const wrapper = mount(Controls, { global: {
      plugins: [pinia], provide: { [brokerKey as symbol]: broker },
    } });
    const game = useGameStore(pinia);
    const players = usePlayersStore(pinia);
    players.username = "Eiri";
    game.connected = true;
    await nextTick();

    await wrapper.get("#red").setValue(true);
    expect(broker.setCaptain).toHaveBeenLastCalledWith(Captain.Red);
    const snapshot = roomSnapshot();
    const me = snapshot.players.find((player) => player.username == "Eiri")!;
    me.captain = Captain.Red;
    me.captainView = true;
    players.applySnapshot(snapshot);
    await nextTick();
    expect((wrapper.get("#red").element as HTMLInputElement).checked).toBe(true);
    expect((wrapper.get("#blue").element as HTMLInputElement).checked).toBe(false);

    await wrapper.get("#blue").setValue(true);
    expect(broker.setCaptain).toHaveBeenLastCalledWith(Captain.Blue);
    me.captain = Captain.Blue;
    players.applySnapshot(snapshot);
    await nextTick();
    expect((wrapper.get("#red").element as HTMLInputElement).checked).toBe(false);
    expect((wrapper.get("#blue").element as HTMLInputElement).checked).toBe(true);
    await wrapper.get("#blue").setValue(false);
    expect(broker.setCaptain).toHaveBeenLastCalledWith(Captain.None);
  });

  it("labels snapshots and disables mutations while disconnected or pending", async () => {
    const pinia = createPinia();
    const broker = { nextGame: vi.fn(), setCaptain: vi.fn() };
    const wrapper = mount(Controls, { global: {
      plugins: [pinia], provide: { [brokerKey as symbol]: broker },
    } });
    const game = useGameStore(pinia);
    game.applySnapshot(roomSnapshot());
    await nextTick();
    expect(wrapper.get("button").text()).toBe("New game");
    expect(wrapper.findAll("button")).toHaveLength(1);
    expect(wrapper.findAll('input[type="checkbox"]')).toHaveLength(2);
    expect(wrapper.text()).not.toContain("New shuffle");
    expect(wrapper.get("button").attributes("disabled")).toBeDefined();
    game.connected = true;
    game.applySnapshot(roomSnapshot({ board: roomSnapshot().board.map((card, idx) =>
      idx == 0 ? { ...card, open: true, color: "white" } : card) }));
    await nextTick();
    expect(wrapper.get("button").text()).toBe("New game");
    expect(wrapper.get("button").attributes("disabled")).toBeUndefined();
    await wrapper.get("button").trigger("click");
    expect(broker.nextGame).toHaveBeenCalledWith();
    game.applySnapshot(roomSnapshot({ result: GameResult.BothTeamsLost }));
    game.pending = true;
    await nextTick();
    expect(wrapper.get("button").text()).toBe("New game");
    expect(wrapper.get("button").attributes("disabled")).toBeDefined();
    game.applySnapshot(roomSnapshot({ result: GameResult.RedTeamWon }));
    await nextTick();
    expect(wrapper.get("button").text()).toBe("New game");
  });
});
