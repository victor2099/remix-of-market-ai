import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Package } from "lucide-react";
import { PageShell } from "@/components/marketplace/page-shell";
import { SectionHeading, StatusBadge } from "@/components/marketplace/primitives";
import { EmptyState, ErrorState } from "@/components/marketplace/states";
import { Panel, SellerGate, useSellerProfile } from "@/components/marketplace/seller-parts";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/hooks/use-session";
import { myOrdersQuery, orderTotal } from "@/lib/api/orders";
import { sellerProductsQuery } from "@/lib/api/products";
import { formatCurrency } from "@/lib/format";
import type { Order } from "@/types/api";

function SellerOrderRow({ order, productName }: { order: Order; productName: string }) {
  return (
    <li className="surface flex flex-wrap items-center justify-between gap-4 p-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
          <Package className="size-5" />
        </span>
        <div className="min-w-0 text-sm">
          <p className="truncate font-semibold text-foreground">{productName}</p>
          <p className="text-muted-foreground">
            Order {order.id} · {order.quantity ?? 1} item(s)
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3 text-sm">
        <div className="text-right">
          <p className="font-semibold text-foreground">
            {formatCurrency(orderTotal(order), order.currency ?? "USD")}
          </p>
          <StatusBadge status={order.status ?? "pending"} />
        </div>
        <Button asChild size="sm" variant="outline">
          <Link to="/orders/$orderId" params={{ orderId: order.id }}>
            View
          </Link>
        </Button>
      </div>
    </li>
  );
}

export function SellerOrdersPage() {
  const { user, isAuthenticated } = useSession();
  const { profile, sellerId } = useSellerProfile();
  const products = useQuery({
    ...sellerProductsQuery(sellerId ?? ""),
    enabled: Boolean(sellerId),
    retry: false,
  });
  const orders = useQuery({ ...myOrdersQuery(), enabled: Boolean(sellerId) });
  const productNames = new Map((products.data ?? []).map((product) => [product.id, product.name]));
  const sellerOrders = (orders.data ?? []).filter(
    (order) => order.product_id !== undefined && productNames.has(String(order.product_id)),
  );

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6 sm:py-14">
        <SectionHeading
          title="Orders"
          description="Orders placed for products in your catalog."
          action={
            <Button asChild size="sm" variant="outline">
              <Link to="/seller">Back to dashboard</Link>
            </Button>
          }
        />
        <SellerGate
          isAuthenticated={isAuthenticated}
          isSeller={isAuthenticated && user?.role === "seller"}
        >
          {profile.isPending ? (
            <Skeleton className="h-40 w-full rounded-2xl" />
          ) : !sellerId ? (
            <EmptyState title="Create your store profile first" />
          ) : products.isError || orders.isError ? (
            <ErrorState
              title="Couldn't load orders"
              onRetry={() => {
                void products.refetch();
                void orders.refetch();
              }}
            />
          ) : products.isPending || orders.isPending ? (
            <Skeleton className="h-40 w-full rounded-2xl" />
          ) : sellerOrders.length === 0 ? (
            <EmptyState title="No orders for your products yet" />
          ) : (
            <Panel title="Your product orders">
              <ul className="grid gap-3">
                {sellerOrders.map((order) => (
                  <SellerOrderRow
                    key={order.id}
                    order={order}
                    productName={productNames.get(String(order.product_id)) ?? "Product"}
                  />
                ))}
              </ul>
            </Panel>
          )}
        </SellerGate>
      </div>
    </PageShell>
  );
}
