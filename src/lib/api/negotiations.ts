import { queryOptions } from "@tanstack/react-query";
import { apiRequest } from "./client";
import type { Agent, Negotiation, NegotiationOffer, NegotiationTurn } from "@/types/api";

/** POST /buyer-agents */
export function createBuyerAgent(input: Record<string, unknown> = {}): Promise<Agent> {
  return apiRequest<Agent>("/buyer-agents", { method: "POST", json: input, silent: true });
}

/** POST /seller-agents */
export function createSellerAgent(input: Record<string, unknown> = {}): Promise<Agent> {
  return apiRequest<Agent>("/seller-agents", { method: "POST", json: input, silent: true });
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