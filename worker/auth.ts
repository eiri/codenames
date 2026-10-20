import { roster } from "../src/game/roster";
import { decode, encode, hashPassword, iterations } from "./passwords";
import type { Credential } from "./passwords";
import type { Env } from "./index";

const lifetime = 12 * 60 * 60;
const bodyLimit = 2048;
const encoder = new TextEncoder();

export interface Session {
  username: string;
  exp: number;
}

export const localHttp = (request: Request, env: Env): boolean => {
  const url = new URL(request.url);
  return env.ALLOW_LOCAL_HTTP == "true" && url.protocol == "http:" &&
    ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
};

export const sameOrigin = (request: Request): boolean =>
  request.headers.get("Origin") == new URL(request.url).origin;

const credentials = (env: Env): Record<string, Credential> => {
  const data = JSON.parse(env.PLAYER_CREDENTIALS);
  if (!data || typeof data != "object" || Array.isArray(data)) {
    throw new Error("Invalid credential configuration");
  }
  for (const [username, value] of Object.entries(data)) {
    const entry = value as Credential;
    if (!Object.hasOwn(roster, username) || !entry ||
      entry.iterations != iterations || typeof entry.salt != "string" ||
      typeof entry.hash != "string" || entry.salt.length != 22 ||
      entry.hash.length != 43 || decode(entry.salt).length != 16 ||
      decode(entry.hash).length != 32) {
      throw new Error("Invalid credential configuration");
    }
  }
  return data;
};

const signingKey = (env: Env): Promise<CryptoKey> => {
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32) {
    throw new Error("Missing session configuration");
  }
  return crypto.subtle.importKey(
    "raw", encoder.encode(env.SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"],
  );
};

const cookieName = (request: Request, env: Env): string =>
  localHttp(request, env) ? "codenames_local" : "__Host-codenames";

const cookie = (request: Request, env: Env, value: string, age: number): string =>
  `${cookieName(request, env)}=${value}; Path=/; Max-Age=${age}; HttpOnly; SameSite=Strict${localHttp(request, env) ? "" : "; Secure"}`;

export const signSession = async (session: Session, env: Env): Promise<string> => {
  const payload = encode(encoder.encode(JSON.stringify(session)));
  const signature = await crypto.subtle.sign("HMAC", await signingKey(env), encoder.encode(payload));
  return `${payload}.${encode(new Uint8Array(signature))}`;
};

export const readSession = async (request: Request, env: Env): Promise<Session | null> => {
  const name = cookieName(request, env);
  const token = (request.headers.get("Cookie") ?? "").split(";")
    .map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
  if (!token || token.length > 1024) return null;

  // Configuration failures must not look like invalid user credentials.
  const configured = credentials(env);
  const key = await signingKey(env);
  try {
    const parts = token.split(".");
    if (parts.length != 2 || decode(parts[1]).length != 32) return null;
    const valid = await crypto.subtle.verify("HMAC", key, decode(parts[1]), encoder.encode(parts[0]));
    if (!valid) return null;

    const session = JSON.parse(new TextDecoder().decode(decode(parts[0])));
    if (!session || typeof session.username != "string" ||
      !Object.hasOwn(configured, session.username) ||
      !Number.isInteger(session.exp) || session.exp <= Math.floor(Date.now() / 1000)) return null;
    return { username: session.username, exp: session.exp };
  } catch {
    return null;
  }
};

const readLogin = async (request: Request): Promise<unknown> => {
  if (request.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase() != "application/json") {
    throw new Error("Invalid login request");
  }
  if (Number(request.headers.get("Content-Length")) > bodyLimit || !request.body) {
    throw new Error("Invalid login request");
  }

  // Bound streamed bodies too, since Content-Length can be absent or false.
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > bodyLimit) {
      await reader.cancel();
      throw new Error("Invalid login request");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true, ignoreBOM: false }).decode(bytes));
};

export const authRequest = async (request: Request, env: Env): Promise<Response | null> => {
  const path = new URL(request.url).pathname;
  if (!["/api/login", "/api/session", "/api/logout"].includes(path)) return null;
  const method = path == "/api/session" ? "GET" : "POST";
  if (request.method != method) {
    return Response.json({ error: "Method not allowed" }, { status: 405, headers: { Allow: method } });
  }
  if (method == "POST" && !sameOrigin(request)) {
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  }
  if (path == "/api/session") {
    const session = await readSession(request, env);
    return Response.json({ username: session?.username ?? null });
  }
  if (path == "/api/logout") {
    return new Response(null, { status: 204, headers: { "Set-Cookie": cookie(request, env, "", 0) } });
  }

  const allowed = await env.LOGIN_LIMITER.limit({
    key: `login:${request.headers.get("CF-Connecting-IP") ?? "local"}`,
  });
  if (!allowed.success) {
    return Response.json({ error: "Too many login attempts" }, { status: 429, headers: { "Retry-After": "60" } });
  }

  let data;
  try {
    data = await readLogin(request);
  } catch {
    return Response.json({ error: "Invalid credentials" }, { status: 400 });
  }
  if (!data || typeof data != "object" || !("username" in data) || !("password" in data) ||
    typeof data.username != "string" || typeof data.password != "string" ||
    data.username.length > 32 || data.password.length == 0 || data.password.length > 1024) {
    return Response.json({ error: "Invalid credentials" }, { status: 400 });
  }

  const configured = credentials(env);
  const entry = Object.hasOwn(configured, data.username) ? configured[data.username] : null;
  // Unknown users do the same hash work to avoid a fast username probe.
  const salt = entry ? decode(entry.salt) : new Uint8Array(16);
  const actual = await hashPassword(data.password, salt);
  const expected = entry ? decode(entry.hash) : new Uint8Array(32);
  const matches = crypto.subtle.timingSafeEqual(actual, expected);
  if (!matches || !entry) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const session = { username: data.username, exp: Math.floor(Date.now() / 1000) + lifetime };
  const token = await signSession(session, env);
  return Response.json({ username: session.username }, {
    headers: { "Set-Cookie": cookie(request, env, token, lifetime) },
  });
};
