import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { PageShell } from "@/components/marketplace/page-shell";
import { SectionHeading } from "@/components/marketplace/primitives";
import { EmptyState } from "@/components/marketplace/states";
import { Panel, SellerGate, num, useSellerProfile } from "@/components/marketplace/seller-parts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/hooks/use-session";
import { createSellerAgent } from "@/lib/api/negotiations";
import { sellerInventoryQuery, sellerProductsQuery } from "@/lib/api/products";
import { formatCurrency } from "@/lib/format";
import type { InventoryRecord, Product } from "@/types/api";

export const Route = createFileRoute("/seller/agents")({
  head: () => ({
    meta: [
      { title: "Seller agents — Haggl" },
      {
        name: "description",
        content:
          "Create an AI seller agent tuned to one of your inventories, with a list price, walk-away price and negotiation round limit.",
      },
      { property: "og:title", content: "Seller agents — Haggl" },
      {
        property: "og:description",
        content: "Configure an AI agent to sell an inventory at the price you choose.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SellerAgentsPage,
});

interface CreatedAgent {
  id: string;
  name: string;
  productName: string;
  listPrice: number | undefined;
  minPrice: number | undefined;
}

function AgentForm({
  sellerId,
  inventory,
  products,
  onCreated,
}: {
  sellerId: string;
  inventory: InventoryRecord[];
  products: Product[];
  onCreated: (agent: CreatedAgent) => void;
}) {
  const [selected, setSelected] = useState<string>(
    inventory[0]?.product_id ? String(inventory[0].product_id) : "",
  );
  const product = products.find((p) => p.id === selected);

  const create = useMutation({
    mutationFn: (input: {
      name: string;
      list_price?: number | undefined;
      min_price?: number | undefined;
      max_negotiation_rounds?: number | undefined;
    }) =>
      createSellerAgent({
        name: input.name,
        seller_id: sellerId,
        ...(input.list_price !== undefined ? { list_price: input.list_price } : {}),
        ...(input.min_price !== undefined ? { min_price: input.min_price } : {}),
        ...(input.max_negotiation_rounds !== undefined
          ? { max_negotiation_rounds: input.max_negotiation_rounds }
          : {}),
      }),
    onSuccess: (agent, variables) => {
      toast.success("Seller agent created", { description: `Agent ID ${agent.id}` });
      onCreated({
        id: String(agent.id),
        name: variables.name,
        productName: product?.name ?? "Selected inventory",
        listPrice: variables.list_price,
        minPrice: variables.min_price,
      });
    },
    onError: (error: Error) => toast.error("Couldn't create agent", { description: error.message }),
  });

  if (inventory.length === 0)
    return (
      <EmptyState
        title="Create an inventory first"
        description="An agent sells the products held in one of your inventories."
        action={
          <Button asChild>
            <Link to="/seller/inventory">Create an inventory</Link>
          </Button>
        }
      />
    );

  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const data = new FormData(form);
        create.mutate(
          {
            name: String(data.get("agent_name") ?? "Seller agent"),
            list_price: num(data.get("list_price")),
            min_price: num(data.get("min_price")),
            max_negotiation_rounds: num(data.get("max_negotiation_rounds")),
          },
          { onSuccess: () => form.reset() },
        );
      }}
    >
      <div className="grid gap-2 sm:col-span-2">
        <Label htmlFor="inventory">Inventory to sell</Label>
        <select
          id="inventory"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="h-10 rounded-xl border border-input bg-card px-3 text-sm text-foreground"
        >
          {inventory.map((row, index) => {
            const id = String(row.product_id ?? index);
            const name = products.find((p) => p.id === id)?.name ?? `Product ${id}`;
            return (
              <option key={row.id ?? `${id}-${index}`} value={id}>
                {name} — {row.quantity_available ?? 0} available
              </option>
            );
          })}
        </select>
        {product ? (
          <p className="text-sm text-muted-foreground">
            Current listed price: {formatCurrency(product.price, product.currency)}
          </p>
        ) : null}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="agent_name">Agent name</Label>
        <Input
          id="agent_name"
          name="agent_name"
          required
          defaultValue={product ? `${product.name} agent` : ""}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="list_price">Selling price</Label>
        <Input
          id="list_price"
          name="list_price"
          type="number"
          min={0}
          step="0.01"
          defaultValue={product?.price ?? ""}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="min_price">Walk-away price</Label>
        <Input id="min_price" name="min_price" type="number" min={0} step="0.01" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="max_negotiation_rounds">Max negotiation rounds</Label>
        <Input
          id="max_negotiation_rounds"
          name="max_negotiation_rounds"
          type="number"
          min={1}
          defaultValue={5}
        />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={create.isPending}>
          Create seller agent
        </Button>
      </div>
    </form>
  );
}

function SellerAgentsPage() {
  const { user, isAuthenticated } = useSession();
  const { profile, sellerId } = useSellerProfile();
  const [created, setCreated] = useState<CreatedAgent[]>([]);
  const products = useQuery({
    ...sellerProductsQuery(sellerId ?? ""),
    enabled: Boolean(sellerId),
    retry: false,
  });
  const inventory = useQuery({
    ...sellerInventoryQuery(sellerId ?? ""),
    enabled: Boolean(sellerId),
    retry: false,
  });

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6 sm:py-14">
        <SectionHeading
          title="Seller agents"
          description="Assign an AI agent to an inventory and let it negotiate at your price."
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
          {profile.isPending || inventory.isPending ? (
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
              <Panel
                title="Create a seller agent"
                description="Pick the inventory it should sell, then set the price it works with."
              >
                <AgentForm
                  sellerId={sellerId}
                  inventory={Array.isArray(inventory.data) ? inventory.data : []}
                  products={products.data ?? []}
                  onCreated={(agent) => setCreated((prev) => [agent, ...prev])}
                />
              </Panel>
              {created.length > 0 ? (
                <Panel title="Agents created this session">
                  <ul className="grid gap-3">
                    {created.map((agent) => (
                      <li key={agent.id} className="rounded-xl border border-border p-4 text-sm">
                        <p className="font-semibold text-foreground">{agent.name}</p>
                        <p className="text-muted-foreground">
                          {agent.productName} · agent {agent.id}
                          {agent.listPrice !== undefined ? ` · sells at ${agent.listPrice}` : ""}
                          {agent.minPrice !== undefined ? ` · floor ${agent.minPrice}` : ""}
                        </p>
                      </li>
                    ))}
                  </ul>
                </Panel>
              ) : null}
            </>
          )}
        </SellerGate>
      </div>
    </PageShell>
  );
}
