import { createFileRoute } from "@tanstack/react-router";

/**
 * Same-origin proxy to the FastAPI backend.
 * The backend currently sends no CORS headers, so the browser cannot call it
 * directly. All app requests go to /api/backend/* and are forwarded here.
 */
const BACKEND_URL = (
  import.meta.env["VITE_API_BASE_URL"] ?? "http://localhost:8000"
).replace(/\/+$/, "");

const HOP_BY_HOP = new Set([
  "host",
  "connection",
  "content-length",
  "transfer-encoding",
  "accept-encoding",
]);

const RETRYABLE_STATUSES = new Set([502, 503, 504]);

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function fetchBackend(target: string, init: RequestInit) {
  let response = await fetch(target, init);

  // Preview tunnels can briefly return a gateway error while reconnecting.
  // Retry idempotent reads before surfacing the outage to the UI.
  if (init.method === "GET" && RETRYABLE_STATUSES.has(response.status)) {
    await response.body?.cancel();
    await wait(250);
    response = await fetch(target, init);
  }

  return response;
}

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
    const res = await fetchBackend(target, { method, headers, body, redirect: "manual" });
    const type = res.headers.get("content-type") ?? "application/json";

    // A private Codespace/tunnel port answers with a GitHub sign-in redirect or
    // HTML page instead of JSON — surface that clearly instead of leaking HTML.
    if (res.status >= 300 && res.status < 400) {
      return new Response(
        JSON.stringify({
          detail:
            "The backend URL redirected to a sign-in page. Make the backend port public so the app can reach it.",
        }),
        { status: 502, headers: { "content-type": "application/json" } },
      );
    }

    if (RETRYABLE_STATUSES.has(res.status)) {
      return new Response(
        JSON.stringify({
          detail: "The backend is temporarily unavailable. Please wait a moment and try again.",
        }),
        {
          status: 503,
          headers: { "content-type": "application/json", "retry-after": "5" },
        },
      );
    }

    const text = await res.text();
    if (type.includes("text/html")) {
      return new Response(
        JSON.stringify({
          detail:
            "The backend returned an HTML page instead of JSON. The API is likely private or not running.",
        }),
        { status: 502, headers: { "content-type": "application/json" } },
      );
    }

    return new Response(text, {
      status: res.status,
      headers: { "content-type": type, "cache-control": "no-store" },
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
