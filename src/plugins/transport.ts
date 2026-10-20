import type { RoomCommand } from "@/game/commands";
import type { RoomReply } from "@/game/snapshot";
import { readReply } from "./protocol";

type Status = (connected: boolean, pending: boolean, error: string) => void;

export class Transport {
  private socket: WebSocket | null = null;
  private retry: ReturnType<typeof setTimeout> | undefined;
  private deadline: ReturnType<typeof setTimeout> | undefined;
  private stopped = true;
  private ready = false;
  private waiting = false;
  private attempt = 0;
  private room = "";
  private receive: (reply: RoomReply) => void = () => {};
  private status: Status = () => {};

  connect(room: string, receive: (reply: RoomReply) => void, status: Status) {
    this.disconnect();
    this.room = room;
    this.receive = receive;
    this.status = status;
    this.stopped = false;
    window.addEventListener("online", this.recover);
    window.addEventListener("offline", this.offline);
    this.open();
  }

  private offline = () => {
    if (this.stopped) return;
    clearTimeout(this.retry);
    clearTimeout(this.deadline);
    const socket = this.socket;
    this.socket = null;
    this.ready = false;
    this.waiting = false;
    socket?.close(4000, "Network changed");
    this.status(false, false, "Disconnected. Waiting for network...");
  };

  private recover = () => {
    if (this.stopped) return;
    // Replace a half-open socket after network recovery, without replaying commands.
    this.offline();
    this.open();
  };

  private timeout(socket: WebSocket) {
    clearTimeout(this.deadline);
    this.deadline = setTimeout(() => {
      if (this.socket == socket) socket.close(4000, "Response timeout");
    }, 10_000);
  }

  private open() {
    if (this.stopped || this.socket) return;
    const url = new URL(`/api/rooms/${encodeURIComponent(this.room)}`, window.location.href);
    url.protocol = url.protocol == "https:" ? "wss:" : "ws:";
    const socket = new WebSocket(url);
    this.socket = socket;
    this.ready = false;
    this.waiting = false;
    this.status(false, false, "");
    this.timeout(socket);

    socket.onmessage = (event) => {
      if (this.socket != socket) return;
      let reply: RoomReply | null = null;
      try { reply = readReply(JSON.parse(event.data)); } catch { /* Close malformed server frames. */ }
      if (!reply) {
        socket.close(4002, "Invalid room snapshot");
        return;
      }
      const first = !this.ready;
      this.ready = true;
      this.attempt = 0;
      if (reply.ack) this.waiting = false;
      if (first || reply.ack) clearTimeout(this.deadline);
      this.receive(reply);
      this.status(true, this.waiting, reply.error ?? "");
    };
    socket.onerror = () => socket.close();
    socket.onclose = (event) => {
      if (this.socket != socket) return;
      clearTimeout(this.deadline);
      this.socket = null;
      this.ready = false;
      this.waiting = false;
      const expired = event.code == 4401;
      if (expired) {
        this.stopped = true;
        window.removeEventListener("online", this.recover);
        window.removeEventListener("offline", this.offline);
      }
      this.status(false, false, expired ? "Session expired. Log in again" : "Disconnected. Reconnecting...");
      if (!this.stopped && !expired) {
        const delay = Math.min(500 * 2 ** Math.min(this.attempt++, 6), 30_000);
        this.retry = setTimeout(() => this.open(), delay);
      }
    };
  }

  send(command: RoomCommand): boolean {
    if (!this.ready || this.waiting || this.socket?.readyState != WebSocket.OPEN) return false;
    try {
      this.socket.send(JSON.stringify(command));
      this.waiting = true;
      this.status(true, true, "");
      this.timeout(this.socket);
      return true;
    } catch {
      this.socket.close();
      return false;
    }
  }

  disconnect() {
    this.stopped = true;
    clearTimeout(this.retry);
    clearTimeout(this.deadline);
    window.removeEventListener("online", this.recover);
    window.removeEventListener("offline", this.offline);
    const socket = this.socket;
    this.socket = null;
    socket?.close(1000, "Left room");
    this.ready = false;
    this.waiting = false;
    this.status(false, false, "");
  }
}
