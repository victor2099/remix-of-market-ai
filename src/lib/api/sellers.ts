import { queryOptions } from "@tanstack/react-query";
import { apiRequest } from "./client";
import type { NegotiationConfig, SellerProfile } from "@/types/api";

export function getMySellerProfile(): Promise<SellerProfile> {
  return apiRequest<SellerProfile>("/sellers/me");
}

export function createMySellerProfile(input: Record<string, unknown>): Promise<SellerProfile> {
  return apiRequest<SellerProfile>("/sellers/me", { method: "POST", json: input });
}

export function updateMySellerProfile(input: Record<string, unknown>): Promise<SellerProfile> {
  return apiRequest<SellerProfile>("/sellers/me", { method: "PUT", json: input });
}

export function getNegotiationConfig(): Promise<NegotiationConfig> {
  return apiRequest<NegotiationConfig>("/sellers/me/negotiation-config");
}

export function updateNegotiationConfig(input: NegotiationConfig): Promise<NegotiationConfig> {
  return apiRequest<NegotiationConfig>("/sellers/me/negotiation-config", {
    method: "PUT",
    json: input,
  });
}

export const sellerProfileQuery = () =>
  queryOptions({ queryKey: ["seller-profile"], queryFn: getMySellerProfile, retry: false });

export const negotiationConfigQuery = () =>
  queryOptions({ queryKey: ["negotiation-config"], queryFn: getNegotiationConfig, retry: false });