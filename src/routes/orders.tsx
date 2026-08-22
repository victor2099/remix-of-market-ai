import { createFileRoute } from "@tanstack/react-router";
import { SellerOrdersPage } from "@/components/marketplace/seller-orders-page";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "Orders — Haggl seller" },
      { name: "description", content: "View orders for products in your seller catalog." },
    ],
  }),
  component: SellerOrdersPage,
});
