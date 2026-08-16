/**
 * Single entry point for every backend call.
 *
 * - Reads the backend origin from `VITE_API_BASE_URL` (falls back to `VITE_API_URL`,
 *   then `http://localhost:8000`).
 * - Injects the stored JWT as `Authorization: Bearer <token>`.
 * - Surfaces 400 / 401 / 404 / 5xx failures as friendly toasts and throws `ApiError`.
 */
import { toast } from "sonner";
import { clearSession, getToken } from "./session";

/** Configured backend origin (used server-side by the /api/backend proxy). */
export const BACKEND_URL = (
  import.meta.env["VITE_API_BASE_URL"] ??
  import.meta.env["VITE_API_URL"] ??
  "http://localhost:8000"
).replace(/\/+$/, "");

/**
 * Browser requests go through the same-origin proxy at /api/backend/*, so the app
 * works even when the FastAPI service has no CORS headers configured.
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

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** JSON body. */
  json?: unknown;
  /** `application/x-www-form-urlencoded` body (OAuth2 password login). */
  form?: Record<string, string>;
  /** Query string params; `undefined`/`null`/"" values are skipped. */
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Attach the bearer token (default: true when a token exists). */
  auth?: boolean;
  /** Skip the automatic error toast (e.g. form submits with inline errors). */
  silent?: boolean;
  signal?: AbortSignal;
}

function buildQuery(query: RequestOptions["query"]) {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function friendlyMessage(status: number, detail: string) {
  switch (status) {
    case 400:
      return detail || "That request wasn't valid. Please check the details and try again.";
    case 401:
      return detail && !/not authenticated/i.test(detail)
        ? detail
        : "Your session has expired. Please sign in again.";
    case 403:
      return detail || "You don't have permission to do that.";
    case 404:
      return detail || "We couldn't find what you were looking for.";
    case 409:
      return detail || "That conflicts with something that already exists.";
    case 422:
      return detail || "Some fields need attention before we can continue.";
    default:
      return detail || (status >= 500 ? "The server had a problem. Please try again." : "Request failed.");
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", json, form, query, auth, silent, signal } = options;
  const headers: Record<string, string> = { accept: "application/json" };

  let body: string | undefined;
  if (form) {
    headers["content-type"] = "application/x-www-form-urlencoded";
    body = new URLSearchParams(form).toString();
  } else if (json !== undefined) {
    headers["content-type"] = "application/json";
    body = JSON.stringify(json);
  }

  const token = getToken();
  if (token && auth !== false) headers["authorization"] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}${buildQuery(query)}`, {
      method,
      headers,
      ...(body === undefined ? {} : { body }),
      ...(signal ? { signal } : {}),
    });
  } catch (error) {
    const message = "Can't reach the server. Check that the backend is running.";
    if (!silent) toast.error("Network error", { description: message });
    throw new ApiError(message, 0);
  }

  if (!res.ok) {
    const detail = await readError(res);
    const message = friendlyMessage(res.status, detail);
    if (res.status === 401 && token) clearSession();
    if (!silent) {
      toast.error(
        res.status === 401
          ? "Signed out"
          : res.status === 404
            ? "Not found"
            : res.status === 400 || res.status === 422
              ? "Check your input"
              : "Something went wrong",
        { description: message },
      );
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
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
