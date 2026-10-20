import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Transport } from "./transport";
import { roomSnapshot } from "@/test/fixtures";

class FakeSocket {
  static OPEN = 1;
  static instances: FakeSocket[] = [];
  readyState = 1;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: ((event: { code: number }) => void) | null = null;
  onerror: (() => void) | null = null;
  send = vi.fn();
  close = vi.fn((code = 1006) => {
    this.readyState = 3;
    this.onclose?.({ code });
  });

  constructor(public url: URL) { FakeSocket.instances.push(this); }
  message(ack = false) {
    this.onmessage?.({ data: JSON.stringify({ snapshot: roomSnapshot(), ...(ack ? { ack } : {}) }) });
  }
}

let transport: Transport;
const receive = vi.fn();
const status = vi.fn();

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  FakeSocket.instances = [];
  vi.stubGlobal("WebSocket", FakeSocket);
  transport = new Transport();
});
afterEach(() => {
  transport.disconnect();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("WebSocket transport", () => {
  it("waits for a snapshot and only unlocks a command on its own acknowledgement", () => {
    transport.connect("212", receive, status);
    const socket = FakeSocket.instances[0];
    expect(socket.url.pathname).toBe("/api/rooms/212");
    expect(transport.send({ type: "next", revision: 0 })).toBe(false);
    socket.message();
    expect(transport.send({ type: "next", revision: 0 })).toBe(true);
    socket.message();
    expect(status).toHaveBeenLastCalledWith(true, true, "");
    expect(transport.send({ type: "next", revision: 0 })).toBe(false);
    socket.message(true);
    expect(status).toHaveBeenLastCalledWith(true, false, "");
  });

  it("reconnects without queuing or replaying uncertain commands", () => {
    transport.connect("212", receive, status);
    const first = FakeSocket.instances[0];
    first.message();
    transport.send({ type: "newShuffle", revision: 0 });
    vi.advanceTimersByTime(10_000);
    expect(first.close).toHaveBeenCalledWith(4000, "Response timeout");
    expect(transport.send({ type: "next", revision: 0 })).toBe(false);
    vi.advanceTimersByTime(500);
    const second = FakeSocket.instances[1];
    second.message();
    expect(second.send).not.toHaveBeenCalled();
    expect(status).toHaveBeenLastCalledWith(true, false, "");
  });

  it("recovers on network restoration and stops reconnecting on expiry or leave", () => {
    transport.connect("212", receive, status);
    FakeSocket.instances[0].message();
    window.dispatchEvent(new Event("offline"));
    expect(transport.send({ type: "next", revision: 0 })).toBe(false);
    window.dispatchEvent(new Event("online"));
    expect(FakeSocket.instances).toHaveLength(2);
    FakeSocket.instances[1].close(4401);
    vi.advanceTimersByTime(60_000);
    window.dispatchEvent(new Event("online"));
    expect(FakeSocket.instances).toHaveLength(2);
    transport.disconnect();
    vi.advanceTimersByTime(60_000);
    expect(FakeSocket.instances).toHaveLength(2);
  });
});
