import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Package } from "lucide-react";
import { PageShell } from "@/components/marketplace/page-shell";
import { SectionHeading, StatusBadge } from "@/components/marketplace/primitives";
import { EmptyState, ErrorState } from "@/components/marketplace/states";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/hooks/use-session";
import { myOrdersQuery, orderTotal } from "@/lib/api/orders";
import { formatCurrency } from "@/lib/format";
import type { Order } from "@/types/api";

function BuyerOrderRow({ order }: { order: Order }) {
  return (
    <li className="surface flex flex-wrap items-center justify-between gap-4 p-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
          <Package className="size-5" />
        </span>
        <div className="min-w-0 text-sm">
          <p className="truncate font-semibold text-foreground">Order {order.id}</p>
          <p className="text-muted-foreground">
            {order.quantity ?? 1} item(s) ·{" "}
            {formatCurrency(orderTotal(order), order.currency ?? "USD")}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <StatusBadge status={order.status ?? "pending"} />
        <Button asChild size="sm" variant="outline">
          <Link to="/orders/$orderId" params={{ orderId: order.id }}>
            View details
          </Link>
        </Button>
      </div>
    </li>
  );
}

export function BuyerOrdersPage() {
  const { isAuthenticated } = useSession();
  const orders = useQuery({ ...myOrdersQuery(), enabled: isAuthenticated, retry: false });

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6 sm:py-14">
        <SectionHeading
          title="Your orders"
          description="Review the orders you placed and their current fulfilment status."
          action={
            <Button asChild size="sm" variant="outline">
              <Link to="/buyer">Buyer dashboard</Link>
            </Button>
          }
        />
        {!isAuthenticated ? (
          <EmptyState
            title="Log in to see your orders"
            action={
              <Button asChild>
                <Link to="/signin">Log in</Link>
              </Button>
            }
          />
        ) : orders.isError ? (
          <ErrorState title="Couldn't load your orders" onRetry={() => orders.refetch()} />
        ) : orders.isPending ? (
          <Skeleton className="h-40 w-full rounded-2xl" />
        ) : orders.data.length === 0 ? (
          <EmptyState
            title="No orders yet"
            description="Start a negotiation and close your first deal."
            action={
              <Button asChild>
                <Link to="/">Browse listings</Link>
              </Button>
            }
          />
        ) : (
          <ul className="grid gap-3">
            {orders.data.map((order) => (
              <BuyerOrderRow key={order.id} order={order} />
            ))}
          </ul>
        )}
      </div>
    </PageShell>
  );
}
