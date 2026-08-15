/**
 * Thin API abstraction. Every network read/write in the app goes through here,
 * so swapping the mock transport for the real backend is a single change:
 * set `VITE_API_URL` and replace `mockTransport` usage in the services.
 */
/** Configured backend origin (used server-side by the /api/backend proxy). */
export const BACKEND_URL = import.meta.env["VITE_API_URL"] ?? "";

/**
 * All browser requests go through the same-origin proxy at /api/backend/*,
 * because the backend does not send CORS headers yet. Once it does, this can
 * become `BACKEND_URL` directly.
 */
export const API_BASE_URL = "/api/backend";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status = 500,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) throw new ApiError(await readError(res), res.status);
  return (await res.json()) as T;
}

/** FastAPI returns `{ detail: string | ValidationError[] }` — turn it into one readable line. */
async function readError(res: Response): Promise<string> {
  const raw = await res.text();
  try {
    const body = JSON.parse(raw) as { detail?: unknown; message?: unknown };
    const detail = body.detail ?? body.message;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      const msgs = detail
        .map((d) => (typeof d === "object" && d && "msg" in d ? String((d as { msg: unknown }).msg) : null))
        .filter(Boolean);
      if (msgs.length > 0) return msgs.join(", ");
    }
  } catch {
    /* not JSON — fall through */
  }
  return raw || `Request failed (${res.status})`;
}

/** Simulates network latency for mock services. */
export function mockDelay<T>(value: T, ms = 450): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}