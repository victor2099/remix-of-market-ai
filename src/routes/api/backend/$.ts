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

  // Only forward the headers the API needs; browser/tunnel headers cause
  // the dev tunnel to reject the request.
  const headers = new Headers({ accept: "application/json" });
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  const authorization = request.headers.get("authorization");
  if (authorization) headers.set("authorization", authorization);

  const method = request.method;
  const body = method === "GET" || method === "HEAD" ? null : await request.text();

  try {
    const res = await fetch(target, { method, headers, body });
    const text = await res.text();
    console.log("[proxy]", method, target, "->", res.status, text.slice(0, 200));
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
