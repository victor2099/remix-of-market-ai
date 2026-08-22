import { queryOptions } from "@tanstack/react-query";
import { ApiError, apiRequest } from "./client";
import type { NegotiationConfig, SellerProfile } from "@/types/api";

/** The API wraps payloads: { seller: {...} }, { results: [...] }, { negotiation_config: {...} } */
function unwrap<T>(payload: unknown, ...keys: string[]): T {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const row = payload as Record<string, unknown>;
    for (const key of keys) {
      const value = row[key];
      if (value && typeof value === "object") return value as T;
    }
  }
  return payload as T;
}

function rows<T>(payload: unknown, ...keys: string[]): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object") {
    const row = payload as Record<string, unknown>;
    for (const key of keys) {
      if (Array.isArray(row[key])) return row[key] as T[];
    }
  }
  return [];
}

/**
 * A brand-new seller has no store profile yet, so the API answers 404.
 * That is a normal "not set up yet" state, not an error — return null quietly.
 */
export async function getMySellerProfile(): Promise<SellerProfile | null> {
  try {
    const data = await apiRequest<unknown>("/sellers/me", { silent: true });
    return unwrap<SellerProfile>(data, "seller", "profile");
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function createMySellerProfile(
  input: Record<string, unknown>,
): Promise<SellerProfile> {
  const data = await apiRequest<unknown>("/sellers/me", { method: "POST", json: input });
  return unwrap<SellerProfile>(data, "seller", "profile");
}

export async function updateMySellerProfile(
  input: Record<string, unknown>,
): Promise<SellerProfile> {
  const data = await apiRequest<unknown>("/sellers/me", { method: "PUT", json: input });
  return unwrap<SellerProfile>(data, "seller", "profile");
}

/** GET /sellers — List Sellers */
export async function listSellers(): Promise<SellerProfile[]> {
  return rows<SellerProfile>(await apiRequest<unknown>("/sellers"), "results", "sellers", "items");
}

/** GET /sellers/{seller_id} — Get Seller */
export async function getSeller(sellerId: string): Promise<SellerProfile> {
  return unwrap<SellerProfile>(await apiRequest<unknown>(`/sellers/${sellerId}`), "seller");
}

export async function getNegotiationConfig(): Promise<NegotiationConfig | null> {
  try {
    const data = await apiRequest<unknown>("/sellers/me/negotiation-config", { silent: true });
    return unwrap<NegotiationConfig>(data, "negotiation_config", "config");
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function updateNegotiationConfig(
  input: NegotiationConfig,
): Promise<NegotiationConfig> {
  const data = await apiRequest<unknown>("/sellers/me/negotiation-config", {
    method: "PUT",
    json: input,
  });
  return unwrap<NegotiationConfig>(data, "negotiation_config", "config");
}


export const sellerProfileQuery = () =>
  queryOptions({ queryKey: ["seller-profile"], queryFn: getMySellerProfile, retry: false });

export const sellersQuery = () =>
  queryOptions({ queryKey: ["sellers"], queryFn: listSellers });

export const sellerQuery = (sellerId: string) =>
  queryOptions({ queryKey: ["seller", sellerId], queryFn: () => getSeller(sellerId) });

export const negotiationConfigQuery = () =>
  queryOptions({ queryKey: ["negotiation-config"], queryFn: getNegotiationConfig, retry: false });