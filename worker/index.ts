import type { Room } from "./room";

export { Room } from "./room";

export interface Env {
  ASSETS: Fetcher;
  ROOMS: DurableObjectNamespace<Room>;
}

export default {
  async fetch(request, env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname != "/api" && !pathname.startsWith("/api/")) {
      return env.ASSETS.fetch(request);
    }

    const match = /^\/api\/rooms\/([^/]+)$/.exec(pathname);
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

    if (request.method != "GET") {
      return Response.json(
        { error: "Method not allowed" },
        { status: 405, headers: { Allow: "GET" } },
      );
    }

    return env.ROOMS.getByName(room).fetch(request);
  },
} satisfies ExportedHandler<Env>;
