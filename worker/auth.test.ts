// @vitest-environment node
import { timingSafeEqual, webcrypto } from "node:crypto";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { authRequest, readSession, sameOrigin, signSession } from "./auth";
import { encode, hashPassword, iterations } from "./passwords";
import type { Env } from "./index";

// Node lacks this Workers extension, but supplies the same constant-time comparison.
Object.defineProperty(webcrypto.subtle, "timingSafeEqual", { value: timingSafeEqual });
vi.stubGlobal("crypto", webcrypto);

const origin = "https://game.example";
const limiter = vi.fn();
let env: Env;

const request = (path: string, body?: unknown, headers: Record<string, string> = {}) =>
  new Request(origin + path, {
    method: body === undefined ? "GET" : "POST",
    headers: { Origin: origin, "Content-Type": "application/json", ...headers },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

const login = (password = "existing password", username = "Eiri") =>
  authRequest(request("/api/login", { username, password }), env);

beforeAll(async () => {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  env = {
    PLAYER_CREDENTIALS: JSON.stringify({
      Eiri: { salt: encode(salt), hash: encode(await hashPassword("existing password", salt)), iterations },
    }),
    SESSION_SECRET: "test-only-signing-secret-with-32-characters",
    LOGIN_LIMITER: { limit: limiter },
  } as unknown as Env;
});

beforeEach(() => { limiter.mockReset().mockResolvedValue({ success: true }); });

describe("authentication", () => {
  it("checks passwords without revealing whether a username exists", async () => {
    const wrong = await login("wrong");
    const unknown = await login("wrong", "Unknown");
    expect(wrong?.status).toBe(401);
    expect(unknown?.status).toBe(401);
    expect(await wrong?.json()).toEqual(await unknown?.json());
    expect(wrong?.headers.has("Set-Cookie")).toBe(false);
  });

  it("issues a secure cookie and restores its fixed-expiry session", async () => {
    const response = await login();
    expect(response?.status).toBe(200);
    expect(await response?.json()).toEqual({ username: "Eiri" });
    const cookie = response!.headers.get("Set-Cookie")!;
    expect(cookie).toContain("__Host-codenames=");
    for (const flag of ["HttpOnly", "Secure", "SameSite=Strict", "Path=/", "Max-Age=43200"]) {
      expect(cookie).toContain(flag);
    }
    expect(cookie).not.toContain("Domain=");
    const restored = await authRequest(request("/api/session", undefined, { Cookie: cookie.split(";")[0] }), env);
    expect(await restored?.json()).toEqual({ username: "Eiri" });
  });

  it("rejects forged, expired, malformed, and removed-user sessions", async () => {
    const now = Math.floor(Date.now() / 1000);
    const expired = await signSession({ username: "Eiri", exp: now - 1 }, env);
    const unknown = await signSession({ username: "Akari", exp: now + 60 }, env);
    const valid = await signSession({ username: "Eiri", exp: now + 60 }, env);
    const forged = `${encode(new TextEncoder().encode(JSON.stringify({ username: "Akari", exp: now + 60 })))}.${valid.split(".")[1]}`;
    for (const token of [expired, unknown, forged, "broken", `${valid}.extra`]) {
      expect(await readSession(request("/api/session", undefined, { Cookie: `__Host-codenames=${token}` }), env)).toBeNull();
    }
  });

  it("rejects missing and foreign origins on state-changing requests", async () => {
    for (const path of ["/api/login", "/api/logout"]) {
      for (const value of ["", "https://other.example", "null"]) {
        const response = await authRequest(request(path, {}, { Origin: value }), env);
        expect(response?.status).toBe(403);
      }
    }
    expect(sameOrigin(request("/api/rooms/212", undefined, { Origin: "https://other.example", Upgrade: "websocket" }))).toBe(false);
    expect(limiter).not.toHaveBeenCalled();
  });

  it("bounds login bodies and uses the configured limiter before hashing", async () => {
    const large = await authRequest(request("/api/login", { password: "a".repeat(2049) }), env);
    expect(large?.status).toBe(400);
    const malformed = await authRequest(new Request(origin + "/api/login", {
      method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: "{",
    }), env);
    expect(malformed?.status).toBe(400);
    limiter.mockResolvedValue({ success: false });
    const limited = await login();
    expect(limited?.status).toBe(429);
    expect(limited?.headers.get("Retry-After")).toBe("60");
  });

  it("limits the HTTP cookie exception to explicitly enabled loopback hosts", async () => {
    const local = { ...env, ALLOW_LOCAL_HTTP: "true" };
    const response = await authRequest(new Request("http://localhost:8787/api/login", {
      method: "POST",
      headers: { Origin: "http://localhost:8787", "Content-Type": "application/json" },
      body: JSON.stringify({ username: "Eiri", password: "existing password" }),
    }), local);
    expect(response?.headers.get("Set-Cookie")).toContain("codenames_local=");
    expect(response?.headers.get("Set-Cookie")).not.toContain("; Secure");
    const remote = await authRequest(request("/api/login", { username: "Eiri", password: "existing password" }), local);
    expect(remote?.headers.get("Set-Cookie")).toContain("; Secure");
  });

  it("clears only the current browser cookie on logout", async () => {
    const response = await authRequest(request("/api/logout", {}), env);
    expect(response?.status).toBe(204);
    expect(response?.headers.get("Set-Cookie")).toContain("__Host-codenames=; Path=/; Max-Age=0;");
  });
});
