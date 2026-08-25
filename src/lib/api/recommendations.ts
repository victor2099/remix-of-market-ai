import { apiRequest } from "./client";
import { normalizeProduct } from "./products";
import type { Product, RecommendationRequest, RecommendationResponse } from "@/types/api";

export interface Recommendation {
  key: string;
  productId: string | null;
  name: string;
  reason: string;
  score: number | null;
  product: Product | null;
}

export interface RecommendationResult {
  summary: string;
  items: Recommendation[];
}

function normalizeRecommendationResponse(res: RecommendationResponse): RecommendationResult {
  const raw = res.recommendations ?? res.items ?? [];
  return {
    summary: res.summary ?? res.reasoning ?? "",
    items: raw.map((item, index) => {
      const product = item.product ? normalizeProduct(item.product) : null;
      return {
        key: `${item.product_id ?? product?.id ?? "rec"}-${index}`,
        productId: item.product_id ?? product?.id ?? null,
        name: product?.name ?? item.name ?? "Recommended product",
        reason: item.reason ?? "",
        score: item.score ?? null,
        product,
      };
    }),
  };
}

/** POST /recommendations — legacy generic recommendation endpoint. */
export async function getRecommendations(
  input: RecommendationRequest,
): Promise<RecommendationResult> {
  const res = await apiRequest<RecommendationResponse>("/recommendations", {
    method: "POST",
    json: {
      intent: input.intent,
      ...(input.budget != null ? { budget: input.budget } : {}),
      ...(input.category ? { category: input.category } : {}),
      ...(input.preferred_brands?.length ? { preferred_brands: input.preferred_brands } : {}),
      ...(input.currency ? { currency: input.currency } : {}),
    },
  });
  return normalizeRecommendationResponse(res);
}

/** Normalize POST /buyer-agents/buyer-agents/{agent_id}/recommend responses for display. */
export function normalizeBuyerAgentRecommendation(response: unknown): RecommendationResult {
  const payload = (
    response && typeof response === "object" ? response : {}
  ) as RecommendationResponse;
  return normalizeRecommendationResponse(payload);
}
