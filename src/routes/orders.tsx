import { createFileRoute } from "@tanstack/react-router";
import { BuyerOrdersPage } from "@/components/marketplace/buyer-orders-page";
import { SellerOrdersPage } from "@/components/marketplace/seller-orders-page";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "Orders — Haggl" },
      { name: "description", content: "View your orders and their current status." },
    ],
  }),
  component: OrdersPage,
});

function OrdersPage() {
  const { user } = useSession();
  return user?.role === "seller" ? <SellerOrdersPage /> : <BuyerOrdersPage />;
}
