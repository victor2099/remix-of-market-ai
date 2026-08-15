import { createFileRoute } from "@tanstack/react-router";

/**
 * Same-origin proxy to the FastAPI backend.
 * The backend currently sends no CORS headers, so the browser cannot call it
 * directly. All app requests go to /api/backend/* and are forwarded here.
 */
const BACKEND_URL = (import.meta.env["VITE_API_URL"] ?? "").replace(/\/$/, "");

const HOP_BY_HOP = new Set([
  "host",
  "connection",
  "content-length",
  "transfer-encoding",
  "accept-encoding",
]);

async function forward({ request, params }: { request: Request; params: { _splat?: string } }) {
  if (!BACKEND_URL) return new Response("Backend URL is not configured", { status: 500 });

  const incoming = new URL(request.url);
  const target = `${BACKEND_URL}/${params._splat ?? ""}${incoming.search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) headers.set(key, value);
  });

  const method = request.method;
  const body = method === "GET" || method === "HEAD" ? undefined : await request.text();

  try {
    const res = await fetch(target, { method, headers, body });
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: {
        "content-type": res.headers.get("content-type") ?? "application/json",
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ detail: `Cannot reach backend: ${(error as Error).message}` }),
      { status: 502, headers: { "content-type": "application/json" } },
    );
  }
}

export const Route = createFileRoute("/api/backend/$")({
  server: {
    handlers: {
      GET: forward,
      POST: forward,
      PUT: forward,
      PATCH: forward,
      DELETE: forward,
    },
  },
});
