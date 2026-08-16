import { queryOptions } from "@tanstack/react-query";
import { apiRequest } from "./client";
import { setStoredUser } from "./session";
import type { ApiUser, UserPreferences } from "@/types/api";

export async function getMe(): Promise<ApiUser> {
  const user = await apiRequest<ApiUser>("/users/me");
  setStoredUser(user);
  return user;
}

export async function updateMe(input: {
  first_name: string;
  last_name: string;
  email: string;
}): Promise<ApiUser> {
  const user = await apiRequest<ApiUser>("/users/me", { method: "PUT", json: input });
  setStoredUser(user);
  return user;
}

export function getPreferences(): Promise<UserPreferences> {
  return apiRequest<UserPreferences>("/users/me/preferences");
}

export function updatePreferences(input: Partial<UserPreferences>): Promise<UserPreferences> {
  return apiRequest<UserPreferences>("/users/me/preferences", { method: "PUT", json: input });
}

export const meQuery = () => queryOptions({ queryKey: ["me"], queryFn: getMe, retry: false });

export const preferencesQuery = () =>
  queryOptions({ queryKey: ["preferences"], queryFn: getPreferences, retry: false });