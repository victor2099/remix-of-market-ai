import { apiRequest } from "./client";
import { clearSession, setStoredUser, setToken } from "./session";
import type { ApiUser, Role, TokenResponse } from "@/types/api";

export interface RegisterInput {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: Role;
}

export interface LoginInput {
  email: string;
  password: string;
}

interface TokenClaims {
  sub?: string;
  user_id?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: Role;
}

function readTokenClaims(token: string): TokenClaims {
  try {
    const payload = token.split(".")[1];
    if (!payload) return {};
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="))) as TokenClaims;
  } catch {
    return {};
  }
}

function userFromLogin(token: TokenResponse, email: string): ApiUser {
  if (token.user) return token.user;
  const claims = readTokenClaims(token.access_token);
  return {
    id: claims.user_id ?? claims.sub ?? email,
    email: claims.email ?? email,
    first_name: claims.first_name ?? email.split("@")[0] ?? "User",
    last_name: claims.last_name ?? "",
    role: claims.role ?? "buyer",
  };
}

/** POST /auth/register */
export async function register(input: RegisterInput): Promise<ApiUser> {
  return apiRequest<ApiUser>("/auth/register", {
    method: "POST",
    auth: false,
    json: {
      email: input.email.trim().toLowerCase(),
      password: input.password,
      first_name: input.first_name.trim(),
      last_name: input.last_name.trim(),
      role: input.role,
    },
  });
}

/** POST /auth/login — OAuth2 password flow (form-encoded, `username` is the email). */
export async function login(input: LoginInput): Promise<ApiUser> {
  const email = input.email.trim().toLowerCase();
  const token = await apiRequest<TokenResponse>("/auth/login", {
    method: "POST",
    auth: false,
    form: { username: email, password: input.password },
  });
  setToken(token.access_token);
  // The live API has no /users/me endpoint. Login may return the user object;
  // otherwise use the identity claims already signed into the access token.
  const user = userFromLogin(token, email);
  setStoredUser(user);
  return user;
}

/** Register, then sign straight in so the app has a token. */
export async function registerAndLogin(input: RegisterInput): Promise<ApiUser> {
  await register(input);
  return login({ email: input.email, password: input.password });
}

/** POST /auth/change-password */
export async function changePassword(input: {
  current_password: string;
  new_password: string;
}): Promise<void> {
  await apiRequest<void>("/auth/change-password", {
    method: "POST",
    json: { old_password: input.current_password, new_password: input.new_password },
  });
}

export function logout() {
  clearSession();
}
