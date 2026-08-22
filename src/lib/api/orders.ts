import { queryOptions } from "@tanstack/react-query";
import { ApiError, apiRequest } from "./client";
import type { Order } from "@/types/api";

/** POST /orders — created from an accepted negotiation; deducts inventory atomically. */
export function createOrder(negotiationId: string): Promise<Order> {
  return apiRequest<Order>("/orders", { method: "POST", json: { negotiation_id: negotiationId } });
}

export function getOrder(orderId: string): Promise<Order> {
  return apiRequest<Order>(`/orders/${orderId}`);
}

/** The API may return a bare array or an envelope ({ orders | results | items }). */
export function orderRows(payload: unknown): Order[] {
  if (Array.isArray(payload)) return payload as Order[];
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    for (const key of ["orders", "results", "items", "data"]) {
      if (Array.isArray(record[key])) return record[key] as Order[];
    }
  }
  return [];
}

export async function listMyOrders(): Promise<Order[]> {
  return orderRows(await apiRequest<unknown>("/orders/user/me"));
}

/**
 * Seller order listings are seller-scoped. Keep a small compatibility fallback
 * for deployments that only expose the authenticated listing route.
 */
export async function listSellerOrders(sellerId: string): Promise<Order[]> {
  const sellerRoutes = [`/orders/seller/${encodeURIComponent(sellerId)}`, "/orders/seller/me"];

  for (const path of sellerRoutes) {
    try {
      return orderRows(await apiRequest<unknown>(path, { silent: true }));
    } catch (error) {
      if (!(error instanceof ApiError) || ![404, 405].includes(error.status)) throw error;
    }
  }

  return orderRows(await apiRequest<unknown>("/orders/user/me"));
}

export function updateOrderStatus(orderId: string, status: string): Promise<Order> {
  return apiRequest<Order>(`/orders/${orderId}/status`, { method: "PATCH", json: { status } });
}

export function orderTotal(order: Order): number {
  return Number(order.total_price ?? order.total_amount ?? 0);
}

export const orderQuery = (orderId: string) =>
  queryOptions({ queryKey: ["order", orderId], queryFn: () => getOrder(orderId) });

export const myOrdersQuery = () =>
  queryOptions({ queryKey: ["orders", "me"], queryFn: listMyOrders, retry: false });

export const sellerOrdersQuery = (sellerId: string) =>
  queryOptions({
    queryKey: ["orders", "seller", sellerId],
    queryFn: () => listSellerOrders(sellerId),
    retry: false,
  });
