import assert from "node:assert/strict";
import WebSocket from "ws";
import { spawn } from "node:child_process";
import { createHmac, randomBytes } from "node:crypto";
import { once } from "node:events";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { roster } from "../src/game/roster.ts";

const root = fileURLToPath(new URL("../", import.meta.url));
await mkdir(path.join(root, ".wrangler"), { recursive: true });
const directory = await mkdtemp(path.join(root, ".wrangler/room-check-"));
const secret = randomBytes(32).toString("base64url");
const credentials = Object.fromEntries(Object.keys(roster).map((name) => [name, {
  salt: randomBytes(16).toString("base64url"), hash: randomBytes(32).toString("base64url"), iterations: 100000,
}]));
await writeFile(path.join(directory, ".dev.vars"),
  `PLAYER_CREDENTIALS='${JSON.stringify(credentials)}'\nSESSION_SECRET='${secret}'\nALLOW_LOCAL_HTTP=true\n`, { mode: 0o600 });
await writeFile(path.join(directory, "wrangler.jsonc"), JSON.stringify({
  name: "codenames-room-check",
  main: path.join(root, "worker/index.ts"),
  compatibility_date: "2026-10-19",
  durable_objects: { bindings: [{ name: "ROOMS", class_name: "Room" }] },
  migrations: [{ tag: "v1", new_sqlite_classes: ["Room"] }],
}));

const listener = createServer().listen(0, "127.0.0.1");
await once(listener, "listening");
const port = listener.address().port;
await new Promise((resolve) => listener.close(resolve));
const origin = `http://127.0.0.1:${port}`;
let worker;
let exited;

const start = async () => {
  worker = spawn(process.execPath, [path.join(root, "node_modules/wrangler/bin/wrangler.js"),
    "dev", "--local", "--config", path.join(directory, "wrangler.jsonc"),
    "--persist-to", path.join(directory, "state"), "--ip", "127.0.0.1", "--port", String(port), "--inspector-port", "0",
  ], {
    cwd: root, detached: true, stdio: "ignore",
    env: { ...process.env, XDG_CONFIG_HOME: path.join(directory, "config"),
      WRANGLER_LOG_PATH: path.join(directory, "logs"), WRANGLER_SEND_METRICS: "false" },
  });
  exited = once(worker, "exit");
  for (let i = 0; i < 100; i++) {
    if (worker.exitCode !== null) throw new Error("Local Worker exited before becoming ready");
    try {
      if ((await fetch(`${origin}/api/session`, { signal: AbortSignal.timeout(500) })).ok) return;
    } catch { /* The local runtime is still starting. */ }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Local Worker did not become ready");
};

const stop = async () => {
  if (!worker) return;
  if (worker.exitCode === null) process.kill(-worker.pid, "SIGTERM");
  await exited;
  worker = null;
};

const cookie = (username, ttl = 43200) => {
  const payload = Buffer.from(JSON.stringify({ username, exp: Math.floor(Date.now() / 1000) + ttl })).toString("base64url");
  return `codenames_local=${payload}.${createHmac("sha256", secret).update(payload).digest("base64url")}`;
};

const sockets = new Set();
const until = async (test) => {
  for (let i = 0; i < 500; i++) {
    const value = test();
    if (value) return value;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error("Timed out waiting for a room message");
};

const connectSocket = async (username, ttl) => {
  const ws = new WebSocket(`${origin.replace("http:", "ws:")}/api/rooms/check`, {
    headers: { Origin: origin, Cookie: cookie(username, ttl) },
    closeTimeout: 1000,
  });
  sockets.add(ws);
  const client = { ws, frames: [], code: null };
  ws.on("message", (data) => client.frames.push(JSON.parse(data.toString())));
  ws.on("close", (code) => { client.code = code; });
  ws.on("error", () => {}); // Handshake failures are checked through readiness/timeouts.
  await until(() => client.frames[0]);
  return client;
};
const last = (client) => client.frames.at(-1).snapshot;
const socketCommand = async (client, action) => {
  const offset = client.frames.length;
  client.ws.send(typeof action == "string" ? action : JSON.stringify({ revision: last(client).revision, ...action }));
  return until(() => client.frames.slice(offset).find((frame) => frame.ack));
};

const send = async (username, command, status = 200) => {
  const response = await fetch(`${origin}/api/rooms/check`, {
    method: command ? "POST" : "GET",
    headers: { Origin: origin, Cookie: cookie(username), "Content-Type": "application/json" },
    ...(command ? { body: JSON.stringify(command) } : {}),
  });
  assert.equal(response.status, status);
  const body = await response.json();
  assert.ok(!("deck" in body.snapshot) && !("captainOrder" in body.snapshot) && !("seed" in body.snapshot));
  return body.snapshot;
};

try {
  await start();
  const [first, joined] = await Promise.all([send("Eiri"), send("Eiri")]);
  assert.deepEqual(first, joined);
  assert.equal(first.revision, 0);
  assert.ok(first.board.every((card) => !card.open && card.color === null));

  // Suggestions never restrict access; a player outside the suggested pair can opt in.
  const captain = Object.keys(roster).find((name) => !first.captains.includes(name));
  let state = await send(captain, { type: "toggleCaptain", revision: 0 });
  assert.ok(state.board.every((card) => card.color !== null));
  const initialBoard = structuredClone(state.board);
  state = await send(captain, { type: "open", idx: 0, revision: state.revision });
  const ordinary = await send(first.captains[0]);
  assert.ok(ordinary.board[0].open && ordinary.board[0].color !== null);
  assert.ok(ordinary.board.slice(1).every((card) => card.color === null));

  const concurrent = await Promise.all([1, 2].map(async (idx) => {
    const response = await fetch(`${origin}/api/rooms/check`, {
      method: "POST", headers: { Origin: origin, Cookie: cookie(captain), "Content-Type": "application/json" },
      body: JSON.stringify({ type: "open", idx, revision: state.revision }),
    });
    return { status: response.status, ...await response.json() };
  }));
  assert.deepEqual(concurrent.map((reply) => reply.status).sort(), [200, 409]);
  state = await send(captain);
  assert.equal(state.revision, 3);
  assert.equal(state.board.filter((card) => card.open).length, 2);
  assert.deepEqual(await send(captain, { type: "next", revision: 0 }, 409), state);

  for (const command of [
    { type: "open", idx: -1 }, { type: "open", idx: 25 }, { type: "open", idx: 0.5 },
    { type: "toggleCaptain", player: "Eiri" }, { type: "newShuffle", seed: "client-seed" },
    { type: "setCaptain", captain: 3 }, { type: "setCaptain", captain: "1" },
    { type: "setCaptain", captain: 1, player: "Eiri" },
    { type: "unknown" }, { type: "restart", padding: "x".repeat(2048) },
  ]) {
    assert.deepEqual(await send(captain, { ...command, revision: state.revision }, 400), state);
  }

  state = await send(captain, { type: "advanceCaptains", revision: state.revision });
  assert.equal(state.captainTurn, 2);
  state = await send(captain, { type: "restart", revision: state.revision });
  assert.equal(state.round, 1);
  assert.equal(state.captainTurn, 2);
  assert.deepEqual(state.board, initialBoard);

  state = await send(first.captains[0], { type: "setCaptain", captain: 2, revision: state.revision });
  const words = new Set(state.board.map((card) => card.word));
  for (let round = 2; round <= 46; round++) {
    state = await send(captain, { type: "next", revision: state.revision });
    assert.equal(state.round, round);
    assert.equal(state.captainTurn, 2);
    assert.ok(state.players.every((player) => !player.captainView && player.captain === 0));
    assert.ok(state.board.every((card) => card.color === null));
    for (const card of state.board) {
      assert.ok(!words.has(card.word));
      words.add(card.word);
    }
  }
  state = await send(captain, { type: "next", revision: state.revision });
  state = await send(captain, { type: "setCaptain", captain: 1, revision: state.revision });
  assert.deepEqual(state.board, initialBoard);
  assert.equal(state.round, 47);

  // Every next command advances the board; only team victories rotate captains.
  for (const color of ["red", "blue", "white", "black"]) {
    const round = state.round;
    const captainTurn = state.captainTurn;
    const cards = state.board.filter((card) => card.color == color);
    const opened = color == "white" || color == "black" ? cards.slice(0, 1) : cards;
    for (const card of opened) {
      state = await send(captain, { type: "open", idx: card.idx, revision: state.revision });
    }
    assert.equal(state.result, { red: 1, blue: 2, white: 0, black: 3 }[color]);
    state = await send(captain, { type: "next", revision: state.revision });
    assert.equal(state.round, round + 1);
    assert.equal(state.captainTurn, captainTurn + (color == "red" || color == "blue" ? 1 : 0));
    assert.ok(state.board.every((card) => !card.open && card.color === null));
    assert.ok(state.players.every((player) => !player.captainView && player.captain === 0));
    state = await send(captain, { type: "setCaptain", captain: 1, revision: state.revision });
  }

  state = await send(captain, { type: "newShuffle", revision: state.revision });
  assert.equal(state.round, 1);
  assert.equal(state.captainTurn, 1);
  assert.notDeepEqual(state.board, initialBoard);
  assert.ok(state.players.find((player) => player.username === captain).captainView);
  state = await send(captain, { type: "open", idx: 0, revision: state.revision });
  const beforeRestart = await send(first.captains[0]);

  // Recreate the actual object/runtime without deleting its SQLite storage.
  await stop();
  await start();
  assert.deepEqual(await send(captain), state);
  assert.deepEqual(await send(first.captains[0]), beforeRestart);
  state = await send(captain, { type: "restart", revision: state.revision });
  assert.equal(state.revision, beforeRestart.revision + 1);
  assert.ok(state.board.every((card) => !card.open));
  const other = first.captains[0];
  let captainSocket = await connectSocket(captain);
  let ordinarySocket = await connectSocket(other);
  await until(() => last(captainSocket).players.find((player) => player.username == other).online);
  assert.ok(last(captainSocket).board.every((card) => card.color !== null));
  assert.ok(last(ordinarySocket).board.every((card) => card.color === null));

  // Multiple tabs share one presence entry without sharing a command queue.
  const tab = await connectSocket(other);
  ordinarySocket.ws.close();
  await until(() => ordinarySocket.code !== null);
  assert.ok((await send(captain)).players.find((player) => player.username == other).online);
  tab.ws.close();
  await until(() => tab.code !== null);
  await until(() => !last(captainSocket).players.find((player) => player.username == other).online);
  ordinarySocket = await connectSocket(other);

  // Taking red through the legacy toggle also removes the previous captain's view.
  let reply = await socketCommand(ordinarySocket, { type: "toggleCaptain" });
  assert.ok(reply.snapshot.board.every((card) => card.color !== null));
  assert.equal(reply.snapshot.players.find((player) => player.username == captain).captain, 0);
  await until(() => last(captainSocket).revision == reply.snapshot.revision);
  assert.ok(last(captainSocket).board.every((card) => card.color === null));
  reply = await socketCommand(ordinarySocket, { type: "toggleCaptain" });
  assert.ok(reply.snapshot.board.every((card) => card.color === null));
  await until(() => last(captainSocket).revision == reply.snapshot.revision);
  reply = await socketCommand(captainSocket, { type: "open", idx: 1 });
  await until(() => last(ordinarySocket).revision == reply.snapshot.revision);
  assert.ok(last(ordinarySocket).board[1].open && last(ordinarySocket).board[1].color !== null);
  assert.ok(last(ordinarySocket).board.filter((card) => !card.open).every((card) => card.color === null));

  for (const invalid of ["{", "x".repeat(1025), { type: "open", idx: -1 },
    { type: "toggleCaptain", player: other }, { type: "unknown" }, { type: "next", revision: 0 }]) {
    const revision = last(captainSocket).revision;
    const rejected = await socketCommand(captainSocket, invalid);
    assert.ok(rejected.error);
    assert.equal(rejected.snapshot.revision, revision);
  }
  for (const client of [captainSocket, ordinarySocket]) {
    for (const frame of client.frames) {
      assert.deepEqual(Object.keys(frame.snapshot).sort(),
        ["board", "captainTurn", "captains", "players", "result", "revision", "round", "scores"].sort());
      assert.ok(frame.snapshot.board.every((card) => !("state" in card)));
    }
  }

  // Expired attachments cannot receive broadcasts or execute commands.
  const expiringName = Object.keys(roster).find((name) => name != captain && name != other);
  const expiring = await connectSocket(expiringName, 2);
  const framesBeforeExpiry = expiring.frames.length;
  await new Promise((resolve) => setTimeout(resolve, 2100));
  await socketCommand(captainSocket, { type: "open", idx: 2 });
  await until(() => expiring.code !== null);
  assert.equal(expiring.code, 4401);
  assert.equal(expiring.frames.length, framesBeforeExpiry);
  const expiresOnCommand = await connectSocket(expiringName, 1);
  const revisionBeforeExpiry = last(captainSocket).revision;
  await new Promise((resolve) => setTimeout(resolve, 1100));
  expiresOnCommand.ws.send(JSON.stringify({ type: "newShuffle", revision: revisionBeforeExpiry }));
  await until(() => expiresOnCommand.code !== null);
  assert.equal(expiresOnCommand.code, 4401);
  assert.equal((await send(captain)).revision, revisionBeforeExpiry);

  const limited = await connectSocket(expiringName);
  for (let i = 0; i < 21; i++) limited.ws.send("{}");
  await until(() => limited.code !== null);
  assert.equal(limited.code, 1008);

  const noCaptain = await socketCommand(captainSocket, { type: "setCaptain", captain: 0 });
  assert.ok(noCaptain.snapshot.board.filter((card) => !card.open).every((card) => card.color === null));
  const redCaptain = await socketCommand(captainSocket, { type: "setCaptain", captain: 1 });
  assert.equal(redCaptain.snapshot.players.find((player) => player.username == captain).captain, 1);
  const blueCaptain = await socketCommand(captainSocket, { type: "setCaptain", captain: 2 });
  assert.equal(blueCaptain.snapshot.players.find((player) => player.username == captain).captain, 2);
  assert.ok(blueCaptain.snapshot.board.every((card) => card.color !== null));
  // Each team has one holder; switching teams clears both the old role and the displaced holder.
  await until(() => last(ordinarySocket).revision == blueCaptain.snapshot.revision);
  reply = await socketCommand(ordinarySocket, { type: "setCaptain", captain: 1 });
  assert.equal(reply.snapshot.players.find((player) => player.username == captain).captain, 2);
  assert.equal(reply.snapshot.players.filter((player) => player.captain == 1).length, 1);
  reply = await socketCommand(ordinarySocket, { type: "setCaptain", captain: 2 });
  assert.equal(reply.snapshot.players.find((player) => player.username == captain).captain, 0);
  assert.equal(reply.snapshot.players.filter((player) => player.captain == 1).length, 0);
  assert.equal(reply.snapshot.players.filter((player) => player.captain == 2).length, 1);
  await until(() => last(captainSocket).revision == reply.snapshot.revision);
  assert.ok(last(captainSocket).board.filter((card) => !card.open).every((card) => card.color === null));

  // Stale selections cannot displace the current captain.
  state = await send(captain, { type: "setCaptain", captain: 2, revision: blueCaptain.snapshot.revision }, 409);
  assert.equal(state.players.find((player) => player.username == other).captain, 2);
  state = await send(captain, { type: "setCaptain", captain: 2, revision: state.revision });
  await until(() => last(ordinarySocket).revision == state.revision);
  assert.ok(last(ordinarySocket).board.filter((card) => !card.open).every((card) => card.color === null));
  assert.equal(last(ordinarySocket).players.find((player) => player.username == other).captain, 0);
  const durable = await send(captain);
  await stop();
  await start();
  captainSocket = await connectSocket(captain);
  ordinarySocket = await connectSocket(other);
  await until(() => last(captainSocket).players.find((player) => player.username == other).online);
  assert.deepEqual(last(captainSocket), durable);
  await socketCommand(captainSocket, { type: "restart" });
  await until(() => last(ordinarySocket).revision == durable.revision + 1);
  assert.ok(last(ordinarySocket).board.every((card) => !card.open && card.color === null));

  console.log("Room checks passed: persistence, revisions, filtering, sockets, presence, expiry, limits, reconnect, restart, next, shuffle, wraparound.");
} finally {
  for (const socket of sockets) socket.terminate();
  await stop();
  await rm(directory, { recursive: true, force: true });
}
