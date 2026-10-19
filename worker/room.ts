import { DurableObject } from "cloudflare:workers";
import type { Env } from "./index";

export class Room extends DurableObject<Env> {
  async fetch(): Promise<Response> {
    // Diagnostic only; no game data or actions until authentication is ready.
    return Response.json({ status: "Room shell ready" });
  }
}
