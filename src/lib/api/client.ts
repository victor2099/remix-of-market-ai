/**
 * Thin API abstraction. Every network read/write in the app goes through here,
 * so swapping the mock transport for the real backend is a single change:
 * set `VITE_API_URL` and replace `mockTransport` usage in the services.
 */
export const API_BASE_URL = import.meta.env["VITE_API_URL"] ?? "";

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
  if (!res.ok) throw new ApiError(await res.text(), res.status);
  return (await res.json()) as T;
}

/** Simulates network latency for mock services. */
export function mockDelay<T>(value: T, ms = 450): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}