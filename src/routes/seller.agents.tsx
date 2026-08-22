import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageShell } from "@/components/marketplace/page-shell";
import { SectionHeading } from "@/components/marketplace/primitives";
import { EmptyState } from "@/components/marketplace/states";
import { Panel, SellerGate, num, useSellerProfile } from "@/components/marketplace/seller-parts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/hooks/use-session";
import { createSellerAgent } from "@/lib/api/negotiations";
import {
  attachSellerAgentToProduct,
  sellerInventoryQuery,
  sellerProductsQuery,
} from "@/lib/api/products";
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
  description: string;
  productId: string;
  productName: string;
  listPrice: number | undefined;
  minPrice: number | undefined;
  status: "active";
}

const sellerAgentsStorageKey = (sellerId: string) => `haggl:seller-agents:${sellerId}`;

function readStoredAgents(sellerId: string): CreatedAgent[] {
  try {
    const value = window.localStorage.getItem(sellerAgentsStorageKey(sellerId));
    if (!value) return [];
    const agents = JSON.parse(value) as CreatedAgent[];
    return Array.isArray(agents) ? agents.map((agent) => ({ ...agent, status: "active" })) : [];
  } catch {
    return [];
  }
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
      description: string;
      list_price?: number | undefined;
      min_price?: number | undefined;
      max_negotiation_rounds?: number | undefined;
    }) =>
      createSellerAgent({
        name: input.name,
        description: input.description,
        seller_id: sellerId,
        ...(input.list_price !== undefined ? { list_price: input.list_price } : {}),
        ...(input.min_price !== undefined ? { min_price: input.min_price } : {}),
        ...(input.max_negotiation_rounds !== undefined
          ? { max_negotiation_rounds: input.max_negotiation_rounds }
          : {}),
      }),
    onSuccess: async (agent, variables) => {
      try {
        if (!selected) throw new Error("No inventory product selected");
        await attachSellerAgentToProduct(selected, String(agent.id));
        toast.success("Seller agent created and activated");
      } catch (error) {
        toast.error("Agent created, but listing sync failed", {
          description: error instanceof Error ? error.message : "Update the listing and try again.",
        });
      }
      onCreated({
        id: String(agent.id),
        name: variables.name,
        description: variables.description,
        productId: selected,
        productName: product?.name ?? "Selected inventory",
        listPrice: variables.list_price,
        minPrice: variables.min_price,
        status: "active",
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
            description: String(data.get("agent_description") ?? ""),
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
      <div className="grid gap-2 sm:col-span-2">
        <Label htmlFor="agent_description">Agent description</Label>
        <Textarea
          id="agent_description"
          name="agent_description"
          required
          placeholder="Describe how this agent should sell and negotiate."
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

function CreatedAgentCard({
  agent,
  onUpdated,
}: {
  agent: CreatedAgent;
  onUpdated: (agent: CreatedAgent) => void;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <li className="rounded-xl border border-border p-4 text-sm">
      {editing ? (
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            onUpdated({
              ...agent,
              name: String(data.get("name") ?? agent.name),
              description: String(data.get("description") ?? agent.description),
              listPrice: num(data.get("list_price")),
              minPrice: num(data.get("min_price")),
            });
            setEditing(false);
            toast.success("Seller agent updated");
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor={`agent-name-${agent.id}`}>Agent name</Label>
            <Input id={`agent-name-${agent.id}`} name="name" defaultValue={agent.name} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`agent-description-${agent.id}`}>Agent description</Label>
            <Textarea
              id={`agent-description-${agent.id}`}
              name="description"
              defaultValue={agent.description}
              required
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor={`agent-list-price-${agent.id}`}>Selling price</Label>
              <Input
                id={`agent-list-price-${agent.id}`}
                name="list_price"
                type="number"
                min={0}
                step="0.01"
                defaultValue={agent.listPrice ?? ""}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`agent-min-price-${agent.id}`}>Walk-away price</Label>
              <Input
                id={`agent-min-price-${agent.id}`}
                name="min_price"
                type="number"
                min={0}
                step="0.01"
                defaultValue={agent.minPrice ?? ""}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm">
              Save changes
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-foreground">{agent.name}</p>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                Active
              </span>
            </div>
            <p className="mt-1 text-muted-foreground">{agent.description}</p>
            <p className="mt-1 text-muted-foreground">
              {agent.productName}
              {agent.listPrice !== undefined ? ` · sells at ${agent.listPrice}` : ""}
              {agent.minPrice !== undefined ? ` · floor ${agent.minPrice}` : ""}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            Update
          </Button>
        </div>
      )}
    </li>
  );
}

function SellerAgentsPage() {
  const { user, isAuthenticated } = useSession();
  const { profile, sellerId } = useSellerProfile();
  const [created, setCreated] = useState<CreatedAgent[]>([]);

  useEffect(() => {
    if (sellerId) setCreated(readStoredAgents(sellerId));
  }, [sellerId]);

  const updateCreated = (next: CreatedAgent[]) => {
    setCreated(next);
    if (sellerId) {
      window.localStorage.setItem(sellerAgentsStorageKey(sellerId), JSON.stringify(next));
    }
  };

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
                  onCreated={(agent) => updateCreated([agent, ...created])}
                />
              </Panel>
              {created.length > 0 ? (
                <Panel title="Seller agents">
                  <ul className="grid gap-3">
                    {created.map((agent) => (
                      <CreatedAgentCard
                        key={agent.id}
                        agent={agent}
                        onUpdated={(updated) =>
                          updateCreated(
                            created.map((current) =>
                              current.id === updated.id ? updated : current,
                            ),
                          )
                        }
                      />
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
