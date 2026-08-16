import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/marketplace/page-shell";
import { SectionHeading, StatusBadge } from "@/components/marketplace/primitives";
import { EmptyState, ErrorState } from "@/components/marketplace/states";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/hooks/use-session";
import { myOrdersQuery, orderTotal } from "@/lib/api/orders";
import { formatCurrency } from "@/lib/format";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Your dashboard — Haggl" },
      { name: "description", content: "Review the orders you closed through AI negotiations." },
      { property: "og:title", content: "Your dashboard — Haggl" },
      { property: "og:description", content: "Orders and negotiated deals in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, isAuthenticated } = useSession();
  const orders = useQuery({ ...myOrdersQuery(), enabled: isAuthenticated });

  return (
    <PageShell>
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-10 sm:px-6 sm:py-14">
        <SectionHeading
          title={user ? `Welcome back, ${user.first_name}` : "Your dashboard"}
          description="Every order here started as a negotiation."
        />
        {!isAuthenticated ? (
          <EmptyState
            title="Sign in to see your orders"
            action={
              <Button asChild>
                <Link to="/signin">Sign in</Link>
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
              <li key={order.id} className="surface flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">Order {order.id}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(orderTotal(order), order.currency ?? "USD")} ·{" "}
                    {order.quantity ?? 1} item(s)
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <StatusBadge status={order.status ?? "pending"} />
                  <Button asChild size="sm" variant="outline">
                    <Link to="/orders/$orderId" params={{ orderId: order.id }}>
                      View
                    </Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageShell>
  );
}
