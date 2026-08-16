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

/** POST /buyer-agents/buyer-agents — Create Buyer Agent */
export function createBuyerAgent(input: CreateBuyerAgentInput): Promise<Agent> {
  return apiRequest<Agent>("/buyer-agents/buyer-agents", {
    method: "POST",
    json: input,
    silent: true,
  });
}

/** GET /buyer-agents/buyer-agents/{agent_id} — Get Buyer Agent */
export function getBuyerAgent(agentId: string): Promise<Agent> {
  return apiRequest<Agent>(`/buyer-agents/buyer-agents/${agentId}`);
}

/** POST /buyer-agents/buyer-agents/{agent_id}/recommend — Trigger Agent Recommendation */
export function triggerBuyerAgentRecommendation(
  agentId: string,
  input: Record<string, unknown> = {},
): Promise<unknown> {
  return apiRequest<unknown>(`/buyer-agents/buyer-agents/${agentId}/recommend`, {
    method: "POST",
    json: input,
  });
}

export interface CreateSellerAgentInput {
  name: string;
  seller_id: string;
  target_price?: number;
  list_price?: number;
  min_price?: number;
  max_negotiation_rounds?: number;
}

/** POST /seller-agents — Create Seller Agent */
export function createSellerAgent(input: CreateSellerAgentInput): Promise<Agent> {
  return apiRequest<Agent>("/seller-agents", { method: "POST", json: input, silent: true });
}

/** GET /seller-agents/{agent_id} — Get Seller Agent */
export function getSellerAgent(agentId: string): Promise<Agent> {
  return apiRequest<Agent>(`/seller-agents/${agentId}`);
}

/** GET /seller-agents/{agent_id}/history — Get Seller Agent History */
export function getSellerAgentHistory(agentId: string): Promise<unknown[]> {
  return apiRequest<unknown[]>(`/seller-agents/${agentId}/history`);
}

export interface StartNegotiationInput {
  buyer_id: string;
  seller_id: string;
  product_id: string;
  quantity: number;
  initial_offer: number;
  max_price: number;
  currency: string;
}

/** POST /negotiations */
export function startNegotiation(input: StartNegotiationInput): Promise<Negotiation> {
  return apiRequest<Negotiation>("/negotiations", { method: "POST", json: input });
}

/** GET /negotiations/{id} */
export function getNegotiation(id: string): Promise<Negotiation> {
  return apiRequest<Negotiation>(`/negotiations/${id}`);
}

/** POST /negotiations/{id}/offers — buyer counter-offer. */
export function submitOffer(
  id: string,
  input: { amount: number; message?: string },
): Promise<Negotiation> {
  return apiRequest<Negotiation>(`/negotiations/${id}/offers`, {
    method: "POST",
    json: {
      offer_price: input.amount,
      amount: input.amount,
      price: input.amount,
      ...(input.message ? { message: input.message } : {}),
    },
  });
}

/** POST /seller-agents/{agent_id}/respond — autonomous seller evaluation. */
export function triggerSellerAgent(
  agentId: string,
  negotiationId: string,
): Promise<Negotiation | NegotiationOffer> {
  return apiRequest<Negotiation | NegotiationOffer>(`/seller-agents/${agentId}/respond`, {
    method: "POST",
    json: { negotiation_id: negotiationId },
  });
}

/** POST /negotiations/{neg_id}/accept — Accept Negotiation */
export function acceptNegotiation(id: string): Promise<Negotiation> {
  return apiRequest<Negotiation>(`/negotiations/${id}/accept`, { method: "POST", json: {} });
}

/** POST /negotiations/{neg_id}/reject — Reject Negotiation */
export function rejectNegotiation(id: string): Promise<Negotiation> {
  return apiRequest<Negotiation>(`/negotiations/${id}/reject`, { method: "POST", json: {} });
}

/** POST /negotiations/{neg_id}/cancel — Cancel Negotiation */
export function cancelNegotiation(id: string): Promise<Negotiation> {
  return apiRequest<Negotiation>(`/negotiations/${id}/cancel`, { method: "POST", json: {} });
}

/** Offer history under whichever key the backend used. */
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
  return (
    negotiation?.status === "active" ||
    negotiation?.status === "in_progress" ||
    negotiation?.status === "pending"
  );
}

export const negotiationQuery = (id: string) =>
  queryOptions({ queryKey: ["negotiation", id], queryFn: () => getNegotiation(id) });