import { authRequest, localHttp, readSession, sameOrigin } from "./auth";
import type { Room } from "./room";

export { Room } from "./room";

export interface Env {
  ASSETS: Fetcher;
  ROOMS: DurableObjectNamespace<Room>;
  LOGIN_LIMITER: RateLimit;
  PLAYER_CREDENTIALS: string;
  SESSION_SECRET: string;
  ALLOW_LOCAL_HTTP?: string;
}

const apiRequest = async (request: Request, env: Env): Promise<Response> => {
  const url = new URL(request.url);
  if (url.protocol != "https:" && !localHttp(request, env)) {
    return Response.json({ error: "HTTPS required" }, { status: 403 });
  }
  const upgrade = request.headers.get("Upgrade")?.toLowerCase() == "websocket";
  if ((upgrade || !["GET", "HEAD", "OPTIONS"].includes(request.method)) && !sameOrigin(request)) {
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  }

  const auth = await authRequest(request, env);
  if (auth) return auth;

  const match = /^\/api\/rooms\/([^/]+)$/.exec(url.pathname);
  if (!match) return Response.json({ error: "Not found" }, { status: 404 });

  let room: string;
  try {
    room = decodeURIComponent(match[1]);
  } catch {
    return Response.json({ error: "Invalid room name" }, { status: 400 });
  }

  // Keep labels case-sensitive and bounded before creating an object.
  if (!/^[A-Za-z0-9_-]{1,32}$/.test(room)) {
    return Response.json({ error: "Invalid room name" }, { status: 400 });
  }
  if (!["GET", "POST"].includes(request.method)) {
    return Response.json({ error: "Method not allowed" }, {
      status: 405, headers: { Allow: "GET, POST" },
    });
  }

  const session = await readSession(request, env);
  if (!session) return Response.json({ error: "Not authenticated" }, { status: 401 });

  const trusted = new Request(request);
  trusted.headers.set("X-Player", session.username);
  trusted.headers.set("X-Session-Expiry", String(session.exp));
  return env.ROOMS.getByName(room).fetch(trusted);
};

export default {
  async fetch(request, env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname != "/api" && !pathname.startsWith("/api/")) {
      return env.ASSETS.fetch(request);
    }

    let response: Response;
    try {
      response = await apiRequest(request, env);
    } catch {
      // Never include credentials or request contents in errors or logs.
      console.error("API request failed");
      response = Response.json({ error: "Service unavailable" }, { status: 503 });
    }
    if (response.status == 101) return response;

    const result = new Response(response.body, response);
    result.headers.set("Cache-Control", "no-store");
    return result;
  },
} satisfies ExportedHandler<Env>;
