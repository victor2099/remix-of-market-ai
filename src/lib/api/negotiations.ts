import { queryOptions } from "@tanstack/react-query";
import { apiRequest } from "./client";
import type { Agent, Negotiation, NegotiationOffer, NegotiationTurn } from "@/types/api";

export interface CreateBuyerAgentInput {
  objective: string;
  category?: string;
  min_budget?: number;
  max_budget?: number;
  preferences?: Record<string, unknown>;
}

export interface BuyerAgentRecommendation {
  recommendations?: unknown[];
  items?: unknown[];
  summary?: string;
  reasoning?: string;
}

/** POST /buyer-agents/buyer-agents — Create Buyer Agent. */
export async function createBuyerAgent(input: CreateBuyerAgentInput): Promise<Agent> {
  const response = await apiRequest<Agent | { agent: Agent }>("/buyer-agents/buyer-agents", {
    method: "POST",
    json: input,
    silent: true,
  });
  return "agent" in response ? response.agent : response;
}

/** GET /buyer-agents/buyer-agents/{agent_id} — Get Buyer Agent. */
export async function getBuyerAgent(agentId: string): Promise<Agent> {
  const response = await apiRequest<Agent | { agent: Agent }>(
    `/buyer-agents/buyer-agents/${agentId}`,
  );
  return "agent" in response ? response.agent : response;
}

/** POST /buyer-agents/buyer-agents/{agent_id}/recommend — Trigger Agent Recommendation. */
export function triggerBuyerAgentRecommendation(
  agentId: string,
  input: Record<string, unknown> = {},
): Promise<BuyerAgentRecommendation> {
  return apiRequest<BuyerAgentRecommendation>(`/buyer-agents/buyer-agents/${agentId}/recommend`, {
    method: "POST",
    json: input,
  });
}

export interface CreateSellerAgentInput {
  seller_id: string;
  name: string;
  list_price: number;
  min_price: number;
  target_price: number;
  max_negotiation_rounds: number;
}

/** POST /seller-agents — Create Seller Agent. */
export async function createSellerAgent(input: CreateSellerAgentInput): Promise<Agent> {
  const response = await apiRequest<Agent | { agent: Agent }>("/seller-agents", {
    method: "POST",
    json: input,
    silent: true,
  });
  return "agent" in response ? response.agent : response;
}

/** GET /seller-agents/{agent_id} — Get Seller Agent. */
export async function getSellerAgent(agentId: string): Promise<Agent> {
  const response = await apiRequest<Agent | { agent: Agent }>(`/seller-agents/${agentId}`);
  return "agent" in response ? response.agent : response;
}

/** POST /seller-agents/{agent_id}/respond — Respond To Negotiation. */
export function respondAsSellerAgent(
  agentId: string,
  input: { negotiation_id: string },
): Promise<Negotiation | NegotiationOffer> {
  return apiRequest<Negotiation | NegotiationOffer>(`/seller-agents/${agentId}/respond`, {
    method: "POST",
    json: input,
  });
}

/** GET /seller-agents/{agent_id}/history — Get Seller Agent History. */
export async function getSellerAgentHistory(agentId: string): Promise<unknown[]> {
  const response = await apiRequest<unknown[] | { history?: unknown[]; items?: unknown[] }>(
    `/seller-agents/${agentId}/history`,
  );
  return Array.isArray(response) ? response : (response.history ?? response.items ?? []);
}

/** POST /negotiations. */
export interface StartNegotiationInput {
  buyer_id: string;
  seller_id: string;
  product_id: string;
  initial_offer: number;
  max_price: number;
  currency: string;
  max_rounds?: number;
}

export function startNegotiation(input: StartNegotiationInput): Promise<Negotiation> {
  return apiRequest<Negotiation>("/negotiations", { method: "POST", json: input });
}

/** GET /negotiations/{id}. */
export function getNegotiation(id: string): Promise<Negotiation> {
  return apiRequest<Negotiation>(`/negotiations/${id}`);
}

/** POST /negotiations/{id}/offers?sender=buyer|seller. */
export function submitOffer(
  id: string,
  input: { amount: number; message?: string; sender?: NegotiationTurn },
): Promise<Negotiation> {
  return apiRequest<Negotiation>(`/negotiations/${id}/offers`, {
    method: "POST",
    query: { sender: input.sender ?? "buyer" },
    json: { price: input.amount, ...(input.message ? { message: input.message } : {}) },
  });
}

/** Compatibility alias used by the negotiation workspace. */
export const triggerSellerAgent = (agentId: string, negotiationId: string) =>
  respondAsSellerAgent(agentId, { negotiation_id: negotiationId });

export function acceptNegotiation(id: string): Promise<Negotiation> {
  return apiRequest<Negotiation>(`/negotiations/${id}/accept`, { method: "POST", json: {} });
}

export function rejectNegotiation(id: string): Promise<Negotiation> {
  return apiRequest<Negotiation>(`/negotiations/${id}/reject`, { method: "POST", json: {} });
}

export function cancelNegotiation(id: string): Promise<Negotiation> {
  return apiRequest<Negotiation>(`/negotiations/${id}/cancel`, { method: "POST", json: {} });
}

export function offerHistory(negotiation: Negotiation | undefined): NegotiationOffer[] {
  if (!negotiation) return [];
  return negotiation.offers ?? negotiation.offer_history ?? negotiation.messages ?? [];
}

export function offerAmount(offer: NegotiationOffer): number {
  return Number(offer.offer_price ?? offer.amount ?? offer.price ?? 0);
}

export function offerSide(offer: NegotiationOffer): NegotiationTurn {
  const side = String(offer.offer_by ?? offer.actor ?? offer.role ?? "buyer").toLowerCase();
  return side.includes("seller") ? "seller" : "buyer";
}

export function isAccepted(negotiation: Negotiation | undefined) {
  return negotiation?.status === "accepted" || negotiation?.status === "completed";
}

export function isOpen(negotiation: Negotiation | undefined) {
  return ["active", "in_progress", "pending"].includes(negotiation?.status ?? "");
}

export const negotiationQuery = (id: string) =>
  queryOptions({ queryKey: ["negotiation", id], queryFn: () => getNegotiation(id) });
