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
  const token = await apiRequest<TokenResponse>("/auth/login", {
    method: "POST",
    auth: false,
    form: { username: input.email.trim().toLowerCase(), password: input.password },
  });
  setToken(token.access_token);
  const user = await apiRequest<ApiUser>("/users/me");
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
  await apiRequest<void>("/auth/change-password", { method: "POST", json: input });
}

export function logout() {
  clearSession();
}
