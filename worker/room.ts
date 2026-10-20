import { DurableObject } from "cloudflare:workers";

import { buildBoard, buildDeck } from "../src/game/board";
import { nextCaptains } from "../src/game/captains";
import { nextCaptainTurn } from "../src/game/flow";
import { shuffle } from "../src/game/random";
import { roster } from "../src/game/roster";
import { boardSize, gameResult, isClosed, openCard, scores } from "../src/game/rules";
import type { RoomCommand } from "../src/game/commands";
import type { CardColor, RoomReply, RoomSnapshot } from "../src/game/snapshot";
import { Captain } from "../src/game/types";
import type { Card } from "../src/game/types";
import type { Env } from "./index";

interface RoomRecord {
  version: 1;
  revision: number;
  deck: Card[];
  round: number;
  board: Card[];
  captainOrder: string[];
  captainTurn: number;
  captainViews: Record<string, boolean | Captain>;
}

const newRoom = (): RoomRecord => {
  const deck = buildDeck();
  const captainOrder = Object.keys(roster);
  shuffle(captainOrder);
  return {
    version: 1,
    revision: 0,
    deck,
    round: 1,
    board: buildBoard(deck, 1),
    captainOrder,
    captainTurn: 1,
    captainViews: Object.fromEntries(captainOrder.map((name) => [name, Captain.None])),
  };
};

interface Connection {
  username: string;
  exp: number;
  active: boolean;
  windowStart: number;
  count: number;
}

const parseCommand = (data: unknown): RoomCommand | null => {
  if (!data || typeof data != "object" || Array.isArray(data)) return null;
  const command = data as Record<string, unknown>;
  if (!Number.isSafeInteger(command.revision) || (command.revision as number) < 0) return null;
  if (command.type == "open") {
    if (!Number.isInteger(command.idx) || (command.idx as number) < 0 ||
      (command.idx as number) >= boardSize || Object.keys(command).length != 3) return null;
    return { type: "open", idx: command.idx as number, revision: command.revision as number };
  }
  if (command.type == "setCaptain" && Object.keys(command).length == 3 &&
    [Captain.None, Captain.Red, Captain.Blue].includes(command.captain as Captain)) {
    return { type: "setCaptain", captain: command.captain as Captain, revision: command.revision as number };
  }
  if (["toggleCaptain", "advanceCaptains", "restart", "next", "newShuffle"].includes(command.type as string) &&
    Object.keys(command).length == 2) {
    return command as RoomCommand;
  }
  return null;
};

const readCommand = async (request: Request): Promise<RoomCommand | null> => {
  if (!request.body) return null;
  if (request.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase() != "application/json" ||
    Number(request.headers.get("Content-Length")) > 1024) {
    await request.body.cancel();
    return null;
  }

  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: false });
  let size = 0;
  let text = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 1024) {
        await reader.cancel();
        return null;
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    return parseCommand(JSON.parse(text));
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
};

export class Room extends DurableObject<Env> {
  private record!: RoomRecord;
  private pending: Promise<unknown> = Promise.resolve();

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    // Initialize once before joins or commands; never reshuffle a stored room.
    ctx.blockConcurrencyWhile(async () => {
      const stored = await ctx.storage.get<RoomRecord>("room");
      if (stored && stored.version != 1) throw new Error("Unsupported room version");
      this.record = stored ?? newRoom();
      if (!stored) await ctx.storage.put("room", this.record);
    });
  }

  private serial<T>(job: () => T | Promise<T>): Promise<T> {
    const result = this.pending.then(job);
    this.pending = result.catch(() => undefined);
    return result;
  }

  private retire(ws: WebSocket, code = 1000, reason = "Connection closed") {
    const connection = ws.deserializeAttachment() as Connection | null;
    if (connection) ws.serializeAttachment({ ...connection, active: false });
    try { ws.close(code, reason); } catch { /* The peer can already be closed. */ }
  }

  private connections(): [WebSocket, Connection][] {
    const active: [WebSocket, Connection][] = [];
    for (const ws of this.ctx.getWebSockets()) {
      const connection = ws.deserializeAttachment() as Connection | null;
      if (ws.readyState != WebSocket.OPEN || !connection?.active) continue;
      if (connection.exp <= Math.floor(Date.now() / 1000)) {
        this.retire(ws, 4401, "Session expired");
      } else {
        active.push([ws, connection]);
      }
    }
    return active;
  }

  private send(ws: WebSocket, error?: string, ack = false) {
    const connection = ws.deserializeAttachment() as Connection | null;
    if (!connection?.active || ws.readyState != WebSocket.OPEN) return;
    if (connection.exp <= Math.floor(Date.now() / 1000)) {
      this.retire(ws, 4401, "Session expired");
      return;
    }
    const body: RoomReply = {
      snapshot: this.snapshot(connection.username),
      ...(error ? { error } : {}),
      ...(ack ? { ack: true } : {}),
    };
    try { ws.send(JSON.stringify(body)); } catch { this.retire(ws, 1011, "Send failed"); }
  }

  private broadcast(sender?: WebSocket) {
    for (const [ws] of this.connections()) this.send(ws, undefined, ws == sender);
  }

  private snapshot(username: string): RoomSnapshot {
    const record = this.record;
    const colors: CardColor[] = ["black", "white", "red", "blue"];
    const online = new Set(this.connections().map(([, connection]) => connection.username));
    return {
      revision: record.revision,
      round: record.round,
      board: record.board.map((card) => ({
        idx: card.idx,
        word: card.word,
        open: !isClosed(card),
        color: record.captainViews[username] || !isClosed(card)
          ? colors[Math.floor(card.state / 2)] : null,
      })),
      scores: scores(record.board),
      result: gameResult(record.board),
      captainTurn: record.captainTurn,
      captains: nextCaptains(record.captainOrder, record.captainTurn),
      players: Object.entries(roster).map(([name, entry]) => ({
        ...entry, username: name,
        // Existing boolean selections retain their view and default to red.
        captain: record.captainViews[name] === true ? Captain.Red :
          (record.captainViews[name] || Captain.None) as Captain,
        captainView: !!record.captainViews[name],
        online: online.has(name),
      })),
    };
  }

  private reply(username: string, status = 200, error?: string): Response {
    const body: RoomReply = { snapshot: this.snapshot(username), ...(error ? { error } : {}) };
    return Response.json(body, { status });
  }

  private async apply(command: RoomCommand, username: string, sender?: WebSocket): Promise<Response> {
    if (command.revision != this.record.revision) {
      return this.reply(username, 409, "Stale revision");
    }
    if (command.type == "open" && !isClosed(this.record.board[command.idx])) {
      return this.reply(username, 409, "Card already open");
    }

    // Commit a copy so a failed write cannot leave unpersisted state in memory.
    const next = structuredClone(this.record);
    switch (command.type) {
      case "open":
        openCard(next.board, command.idx);
        break;
      case "toggleCaptain":
      case "setCaptain": {
        const captain = command.type == "setCaptain" ? command.captain :
          next.captainViews[username] ? Captain.None : Captain.Red;

        // A new selection replaces every holder, including legacy boolean roles.
        if (captain != Captain.None) {
          for (const [name, selected] of Object.entries(next.captainViews)) {
            if ((selected === true ? Captain.Red : selected) == captain) {
              next.captainViews[name] = Captain.None;
            }
          }
        }
        next.captainViews[username] = captain;
        break;
      }
      case "advanceCaptains":
        next.captainTurn += 1;
        break;
      case "restart":
        next.board = buildBoard(next.deck, next.round);
        break;
      case "next":
        next.round += 1;
        next.captainTurn = nextCaptainTurn(next.captainTurn, gameResult(next.board));
        next.board = buildBoard(next.deck, next.round);
        next.captainViews = Object.fromEntries(Object.keys(next.captainViews).map((name) => [name, Captain.None]));
        break;
      case "newShuffle": {
        const fresh = newRoom();
        next.deck = fresh.deck;
        next.board = fresh.board;
        next.round = 1;
        next.captainOrder = fresh.captainOrder;
        next.captainTurn = 1;
        break;
      }
    }
    next.revision += 1;
    await this.ctx.storage.put("room", next);
    this.record = next;
    this.broadcast(sender);
    return this.reply(username);
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    return this.serial(async () => {
      const connection = ws.deserializeAttachment() as Connection | null;
      if (!connection?.active || connection.exp <= Math.floor(Date.now() / 1000)) {
        this.retire(ws, 4401, "Session expired");
        this.broadcast();
        return;
      }

      // Attach limiter state so hibernation cannot reset a connection's budget.
      const now = Date.now();
      if (now - connection.windowStart >= 10_000) {
        connection.windowStart = now;
        connection.count = 0;
      }
      connection.count += 1;
      ws.serializeAttachment(connection);
      if (connection.count > 20) {
        this.send(ws, "Too many commands", true);
        this.retire(ws, 1008, "Too many commands");
        this.broadcast();
        return;
      }

      let command: RoomCommand | null = null;
      if (typeof message == "string" && new TextEncoder().encode(message).length <= 1024) {
        try { command = parseCommand(JSON.parse(message)); } catch { /* Reject malformed JSON. */ }
      }
      if (!command) {
        this.send(ws, "Invalid command", true);
        return;
      }
      try {
        const response = await this.apply(command, connection.username, ws);
        if (!response.ok) {
          const body = await response.json() as RoomReply;
          this.send(ws, body.error, true);
        }
      } catch {
        console.error("Room command failed");
        this.send(ws, "Command failed", true);
      }
    });
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    return this.serial(() => {
      this.retire(ws);
      this.broadcast();
    });
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    return this.webSocketClose(ws);
  }

  async fetch(request: Request): Promise<Response> {
    const username = request.headers.get("X-Player") ?? "";
    const expiry = Number(request.headers.get("X-Session-Expiry"));
    if (!Object.hasOwn(roster, username) || !Number.isSafeInteger(expiry) ||
      expiry <= Math.floor(Date.now() / 1000)) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (!["GET", "POST"].includes(request.method)) {
      return Response.json({ error: "Method not allowed" }, { status: 405, headers: { Allow: "GET, POST" } });
    }

    const command = request.method == "POST" ? await readCommand(request) : null;

    // Serialize reads and writes across all awaits, including storage writes.
    return this.serial(() => {
      if (expiry <= Math.floor(Date.now() / 1000)) {
        return Response.json({ error: "Session expired" }, { status: 401 });
      }
      if (request.headers.get("Upgrade")?.toLowerCase() == "websocket") {
        const [client, server] = Object.values(new WebSocketPair());
        this.ctx.acceptWebSocket(server);
        server.serializeAttachment({ username, exp: expiry, active: true, windowStart: Date.now(), count: 0 } satisfies Connection);
        this.broadcast();
        return new Response(null, { status: 101, webSocket: client });
      }
      if (request.method == "GET") return this.reply(username);
      if (!command) return this.reply(username, 400, "Invalid command");
      return this.apply(command, username);
    });
  }
}
