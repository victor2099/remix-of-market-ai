import { apiRequest } from "./client";

/** Shape returned by POST /auth/register and POST /auth/login. */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  user: AuthUser;
  access_token: string;
  token_type: string;
  message?: string;
}

export interface SignUpInput {
  fullName: string;
  email: string;
  password: string;
  role?: "buyer" | "seller";
}

export interface SignInInput {
  email: string;
  password: string;
}

const SESSION_KEY = "haggl.session";

export interface Session {
  token: string;
  user: AuthUser;
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function saveSession(res: AuthResponse): Session {
  const session: Session = { token: res.access_token, user: res.user };
  if (typeof window !== "undefined")
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function clearSession() {
  if (typeof window !== "undefined") window.localStorage.removeItem(SESSION_KEY);
}

/** Authorization header for authenticated backend calls. */
export function authHeaders(): Record<string, string> {
  const session = getSession();
  return session ? { Authorization: `Bearer ${session.token}` } : {};
}

export async function signUp(input: SignUpInput): Promise<Session> {
  const res = await apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: input.fullName.trim(),
      email: input.email.trim().toLowerCase(),
      password: input.password,
      role: input.role ?? "buyer",
    }),
  });
  return saveSession(res);
}

export async function signIn(input: SignInInput): Promise<Session> {
  const res = await apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: input.email.trim().toLowerCase(),
      password: input.password,
    }),
  });
  return saveSession(res);
}
