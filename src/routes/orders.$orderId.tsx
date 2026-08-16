import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { PageShell } from "@/components/marketplace/page-shell";
import { StatusBadge } from "@/components/marketplace/primitives";
import { ErrorState } from "@/components/marketplace/states";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { orderQuery, orderTotal } from "@/lib/api/orders";
import { formatCurrency } from "@/lib/format";

export const Route = createFileRoute("/orders/$orderId")({
  head: () => ({
    meta: [
      { title: "Order confirmation — Haggl" },
      { name: "description", content: "Your negotiated order details and current fulfilment status." },
      { property: "og:title", content: "Order confirmation — Haggl" },
      { property: "og:description", content: "Track the order you negotiated on Haggl." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OrderPage,
});

function OrderPage() {
  const { orderId } = Route.useParams();
  const order = useQuery(orderQuery(orderId));

  return (
    <PageShell>
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        {order.isError ? (
          <ErrorState title="Order not found" onRetry={() => order.refetch()} />
        ) : order.isPending ? (
          <Skeleton className="h-64 w-full rounded-2xl" />
        ) : (
          <div className="surface p-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="size-6 text-success" />
              <h1 className="text-xl font-bold tracking-tight text-foreground">Order confirmed</h1>
            </div>
            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Order ID</dt>
                <dd className="font-medium text-foreground">{order.data.id}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Quantity</dt>
                <dd className="font-medium text-foreground">{order.data.quantity ?? 1}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Total paid</dt>
                <dd className="font-medium text-foreground">
                  {formatCurrency(orderTotal(order.data), order.data.currency ?? "USD")}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <StatusBadge status={order.data.status ?? "pending"} />
                </dd>
              </div>
            </dl>
            <div className="mt-6 flex gap-3">
              <Button asChild variant="outline">
                <Link to="/dashboard">View all orders</Link>
              </Button>
              <Button asChild>
                <Link to="/">Keep shopping</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
