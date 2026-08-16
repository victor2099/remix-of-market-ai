import { queryOptions } from "@tanstack/react-query";
import { apiRequest } from "./client";
import type { Order } from "@/types/api";

/** POST /orders — created from an accepted negotiation; deducts inventory atomically. */
export function createOrder(negotiationId: string): Promise<Order> {
  return apiRequest<Order>("/orders", { method: "POST", json: { negotiation_id: negotiationId } });
}

export function getOrder(orderId: string): Promise<Order> {
  return apiRequest<Order>(`/orders/${orderId}`);
}

export function listMyOrders(): Promise<Order[]> {
  return apiRequest<Order[]>("/orders/user/me");
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