import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageShell } from "@/components/marketplace/page-shell";
import { SectionHeading } from "@/components/marketplace/primitives";
import { EmptyState, ErrorState } from "@/components/marketplace/states";
import { Panel, SellerGate, num, useSellerProfile } from "@/components/marketplace/seller-parts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/hooks/use-session";
import {
  releaseInventory,
  reserveInventory,
  sellerInventoryQuery,
  sellerProductsQuery,
  updateInventory,
} from "@/lib/api/products";
import type { InventoryRecord, Product } from "@/types/api";

export const Route = createFileRoute("/seller/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory — Haggl seller" },
      {
        name: "description",
        content:
          "Create inventory for a product, update available stock, reserve or release units and list every inventory record you own.",
      },
      { property: "og:title", content: "Inventory — Haggl seller" },
      {
        property: "og:description",
        content: "Create, update, reserve and release stock for your Haggl listings.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SellerInventoryPage,
});

function InventoryRow({
  row,
  sellerId,
  productName,
}: {
  row: InventoryRecord;
  sellerId: string;
  productName: string;
}) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["seller-inventory", sellerId] });

  const update = useMutation({
    mutationFn: (quantity: number) => updateInventory(String(row.id), quantity),
    onSuccess: () => {
      toast.success("Stock updated");
      void invalidate();
    },
    onError: (error: Error) => toast.error("Couldn't update stock", { description: error.message }),
  });
  const reserve = useMutation({
    mutationFn: (quantity: number) => reserveInventory(String(row.id), quantity),
    onSuccess: () => {
      toast.success("Units reserved");
      void invalidate();
    },
    onError: (error: Error) => toast.error("Couldn't reserve", { description: error.message }),
  });
  const release = useMutation({
    mutationFn: (quantity: number) => releaseInventory(String(row.id), quantity),
    onSuccess: () => {
      toast.success("Units released");
      void invalidate();
    },
    onError: (error: Error) => toast.error("Couldn't release", { description: error.message }),
  });

  return (
    <li className="rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">{productName}</p>
          <p className="text-muted-foreground">
            {row.quantity_available ?? 0} available
            {row.quantity_reserved ? ` · ${row.quantity_reserved} reserved` : ""}
          </p>
        </div>
      </div>
      {row.id ? (
        <div className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              update.mutate(num(data.get("quantity")) ?? 0);
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor={`stock-${row.id}`}>Available stock</Label>
              <Input
                id={`stock-${row.id}`}
                name="quantity"
                type="number"
                min={0}
                defaultValue={row.quantity_available ?? 0}
                className="h-9 w-24"
              />
            </div>
            <Button size="sm" variant="outline" type="submit" disabled={update.isPending}>
              Update
            </Button>
          </form>
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              const qty = num(data.get("units")) ?? 0;
              if (String(data.get("intent")) === "release") release.mutate(qty);
              else reserve.mutate(qty);
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor={`units-${row.id}`}>Units</Label>
              <Input
                id={`units-${row.id}`}
                name="units"
                type="number"
                min={1}
                defaultValue={1}
                className="h-9 w-24"
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              type="submit"
              name="intent"
              value="reserve"
              disabled={reserve.isPending}
            >
              Reserve
            </Button>
            <Button
              size="sm"
              variant="outline"
              type="submit"
              name="intent"
              value="release"
              disabled={release.isPending}
            >
              Release
            </Button>
          </form>
        </div>
      ) : null}
    </li>
  );
}

function InventoryList({ sellerId, products }: { sellerId: string; products: Product[] }) {
  const inventory = useQuery({ ...sellerInventoryQuery(sellerId), retry: false });
  if (inventory.isPending) return <Skeleton className="h-24 w-full rounded-2xl" />;
  if (inventory.isError)
    return <ErrorState title="Couldn't load inventory" onRetry={() => inventory.refetch()} />;
  const rows = Array.isArray(inventory.data) ? inventory.data : [];
  if (rows.length === 0)
    return <EmptyState title="No inventory yet" description="Create your first record above." />;

  return (
    <ul className="grid gap-3">
      {rows.map((row, index) => (
        <InventoryRow
          key={row.id ?? `${row.product_id}-${index}`}
          row={row}
          sellerId={sellerId}
          productName={
            products.find((p) => p.id === String(row.product_id))?.name ??
            `Product ${row.product_id}`
          }
        />
      ))}
    </ul>
  );
}

function SellerInventoryPage() {
  const { user, isAuthenticated } = useSession();
  const { profile, sellerId } = useSellerProfile();
  const products = useQuery({
    ...sellerProductsQuery(sellerId ?? ""),
    enabled: Boolean(sellerId),
    retry: false,
  });

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6 sm:py-14">
        <SectionHeading
          title="Inventory"
          description="Create records, restock, reserve units and release them back to buyers."
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
            <EmptyState
              title="Create your store profile first"
              action={
                <Button asChild>
                  <Link to="/seller">Set up store profile</Link>
                </Button>
              }
            />
          ) : (
            <>
              <Panel title="Your inventory">
                <InventoryList sellerId={sellerId} products={products.data ?? []} />
              </Panel>
            </>
          )}
        </SellerGate>
      </div>
    </PageShell>
  );
}
