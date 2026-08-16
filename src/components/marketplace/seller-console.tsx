import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { SectionHeading, StatusBadge } from "@/components/marketplace/primitives";
import { EmptyState, ErrorState } from "@/components/marketplace/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createMySellerProfile,
  negotiationConfigQuery,
  sellerProfileQuery,
  updateMySellerProfile,
  updateNegotiationConfig,
} from "@/lib/api/sellers";
import {
  CATEGORIES,
  createInventory,
  createProduct,
  deactivateProduct,
  sellerInventoryQuery,
  sellerProductsQuery,
  updateInventory,
} from "@/lib/api/products";
import { createSellerAgent } from "@/lib/api/negotiations";
import { myOrdersQuery, orderTotal } from "@/lib/api/orders";
import { formatCurrency } from "@/lib/format";
import type { ApiUser, NegotiationConfig, SellerProfile } from "@/types/api";

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="surface space-y-4 p-5">
      <div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function num(value: FormDataEntryValue | null): number | undefined {
  const n = Number(value);
  return value === null || value === "" || Number.isNaN(n) ? undefined : n;
}

function ProfileForm({ profile }: { profile: SellerProfile | undefined }) {
  const qc = useQueryClient();
  const save = useMutation({
    mutationFn: (input: Record<string, unknown>) =>
      profile ? updateMySellerProfile(input) : createMySellerProfile(input),
    onSuccess: () => {
      toast.success(profile ? "Store profile updated" : "Store profile created");
      void qc.invalidateQueries({ queryKey: ["seller-profile"] });
    },
    onError: (error: Error) => toast.error("Couldn't save profile", { description: error.message }),
  });

  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        save.mutate({
          business_name: String(data.get("business_name") ?? ""),
          description: String(data.get("description") ?? ""),
          contact_email: String(data.get("contact_email") ?? ""),
          phone: String(data.get("phone") ?? ""),
        });
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="business_name">Store name</Label>
        <Input
          id="business_name"
          name="business_name"
          required
          defaultValue={profile?.business_name ?? profile?.store_name ?? ""}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="contact_email">Contact email</Label>
        <Input
          id="contact_email"
          name="contact_email"
          type="email"
          defaultValue={profile?.contact_email ?? ""}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" defaultValue={profile?.phone ?? ""} />
      </div>
      <div className="grid gap-2 sm:col-span-2">
        <Label htmlFor="description">About your store</Label>
        <Textarea id="description" name="description" defaultValue={profile?.description ?? ""} />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={save.isPending}>
          {profile ? "Save changes" : "Create store profile"}
        </Button>
      </div>
    </form>
  );
}

function NegotiationConfigForm() {
  const qc = useQueryClient();
  const config = useQuery({ ...negotiationConfigQuery() });
  const save = useMutation({
    mutationFn: (input: NegotiationConfig) => updateNegotiationConfig(input),
    onSuccess: () => {
      toast.success("Negotiation rules saved");
      void qc.invalidateQueries({ queryKey: ["negotiation-config"] });
    },
    onError: (error: Error) => toast.error("Couldn't save rules", { description: error.message }),
  });
  const current = config.data;

  return (
    <form
      className="grid gap-4 sm:grid-cols-3"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        save.mutate({
          min_acceptable_price: num(data.get("min_acceptable_price")) ?? null,
          auto_accept_threshold: num(data.get("auto_accept_threshold")) ?? null,
          max_discount_percent: num(data.get("max_discount_percent")) ?? null,
          max_rounds: num(data.get("max_rounds")) ?? null,
        });
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="min_acceptable_price">Price floor</Label>
        <Input
          id="min_acceptable_price"
          name="min_acceptable_price"
          type="number"
          min={0}
          step="0.01"
          defaultValue={current?.min_acceptable_price ?? current?.min_price ?? ""}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="auto_accept_threshold">Auto-accept at</Label>
        <Input
          id="auto_accept_threshold"
          name="auto_accept_threshold"
          type="number"
          min={0}
          step="0.01"
          defaultValue={current?.auto_accept_threshold ?? ""}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="max_discount_percent">Max discount %</Label>
        <Input
          id="max_discount_percent"
          name="max_discount_percent"
          type="number"
          min={0}
          max={100}
          defaultValue={current?.max_discount_percent ?? ""}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="max_rounds">Max rounds</Label>
        <Input
          id="max_rounds"
          name="max_rounds"
          type="number"
          min={1}
          defaultValue={current?.max_rounds ?? ""}
        />
      </div>
      <div className="sm:col-span-3">
        <Button type="submit" variant="outline" disabled={save.isPending}>
          Save negotiation rules
        </Button>
      </div>
    </form>
  );
}

function NewListingForm({ sellerId }: { sellerId: string }) {
  const qc = useQueryClient();
  const [stock, setStock] = useState("1");
  const create = useMutation({
    mutationFn: async (input: {
      name: string;
      description: string;
      price: number;
      category: string;
      quantity: number;
    }) => {
      const product = await createProduct({
        name: input.name,
        description: input.description,
        price: input.price,
        category: input.category,
        seller_id: sellerId,
      });
      if (input.quantity > 0) {
        await createInventory({
          product_id: product.id,
          seller_id: sellerId,
          quantity: input.quantity,
        }).catch(() => undefined);
      }
      return product;
    },
    onSuccess: () => {
      toast.success("Listing published");
      void qc.invalidateQueries({ queryKey: ["seller-products", sellerId] });
      void qc.invalidateQueries({ queryKey: ["seller-inventory", sellerId] });
      void qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: Error) => toast.error("Couldn't publish", { description: error.message }),
  });

  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const data = new FormData(form);
        create.mutate(
          {
            name: String(data.get("name") ?? ""),
            description: String(data.get("description") ?? ""),
            price: num(data.get("price")) ?? 0,
            category: String(data.get("category") ?? CATEGORIES[0]),
            quantity: Number(stock) || 0,
          },
          { onSuccess: () => form.reset() },
        );
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="name">Product name</Label>
        <Input id="name" name="name" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="price">Price</Label>
        <Input id="price" name="price" type="number" min={0} step="0.01" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="category">Category</Label>
        <select
          id="category"
          name="category"
          className="h-10 rounded-xl border border-input bg-card px-3 text-sm text-foreground"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="quantity">Starting stock</Label>
        <Input
          id="quantity"
          name="quantity"
          type="number"
          min={0}
          value={stock}
          onChange={(e) => setStock(e.target.value)}
        />
      </div>
      <div className="grid gap-2 sm:col-span-2">
        <Label htmlFor="product-description">Description</Label>
        <Textarea id="product-description" name="description" required />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={create.isPending}>
          Publish listing
        </Button>
      </div>
    </form>
  );
}

function SellerListings({ sellerId }: { sellerId: string }) {
  const qc = useQueryClient();
  const products = useQuery({ ...sellerProductsQuery(sellerId), retry: false });
  const remove = useMutation({
    mutationFn: (productId: string) => deactivateProduct(productId),
    onSuccess: () => {
      toast.success("Listing deactivated");
      void qc.invalidateQueries({ queryKey: ["seller-products", sellerId] });
    },
    onError: (error: Error) => toast.error("Couldn't deactivate", { description: error.message }),
  });

  if (products.isPending) return <Skeleton className="h-24 w-full rounded-2xl" />;
  if (products.isError)
    return <ErrorState title="Couldn't load your listings" onRetry={() => products.refetch()} />;
  if (products.data.length === 0)
    return <EmptyState title="No listings yet" description="Publish your first product below." />;

  return (
    <ul className="grid gap-3">
      {products.data.map((product) => (
        <li key={product.id} className="rounded-xl border border-border p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{product.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatCurrency(product.price, product.currency)} · {product.category}
                {product.stock !== null ? ` · ${product.stock} in stock` : ""}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button asChild size="sm" variant="outline">
                <Link to="/product/$productId" params={{ productId: product.id }}>
                  View
                </Link>
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={remove.isPending}
                onClick={() => remove.mutate(product.id)}
              >
                Deactivate
              </Button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function SellerInventory({ sellerId }: { sellerId: string }) {
  const qc = useQueryClient();
  const inventory = useQuery({ ...sellerInventoryQuery(sellerId), retry: false });
  const restock = useMutation({
    mutationFn: (input: { id: string; quantity: number }) =>
      updateInventory(input.id, { quantity_available: input.quantity }),
    onSuccess: () => {
      toast.success("Inventory updated");
      void qc.invalidateQueries({ queryKey: ["seller-inventory", sellerId] });
    },
    onError: (error: Error) => toast.error("Couldn't update stock", { description: error.message }),
  });

  if (inventory.isPending) return <Skeleton className="h-20 w-full rounded-2xl" />;
  if (inventory.isError)
    return <ErrorState title="Couldn't load inventory" onRetry={() => inventory.refetch()} />;
  const rows = Array.isArray(inventory.data) ? inventory.data : [];
  if (rows.length === 0) return <EmptyState title="No inventory records yet" />;

  return (
    <ul className="grid gap-3">
      {rows.map((row, index) => (
        <li
          key={row.id ?? `${row.product_id}-${index}`}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"
        >
          <div className="min-w-0 text-sm">
            <p className="truncate font-semibold text-foreground">Product {row.product_id}</p>
            <p className="text-muted-foreground">
              {row.quantity_available} available
              {row.quantity_reserved ? ` · ${row.quantity_reserved} reserved` : ""}
            </p>
          </div>
          {row.id ? (
            <form
              className="flex shrink-0 items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const data = new FormData(e.currentTarget);
                restock.mutate({ id: row.id!, quantity: num(data.get("quantity")) ?? 0 });
              }}
            >
              <Label className="sr-only" htmlFor={`stock-${row.id}`}>
                New quantity
              </Label>
              <Input
                id={`stock-${row.id}`}
                name="quantity"
                type="number"
                min={0}
                defaultValue={row.quantity_available}
                className="h-9 w-24"
              />
              <Button size="sm" variant="outline" type="submit" disabled={restock.isPending}>
                Update
              </Button>
            </form>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function SellerAgentPanel({ sellerId }: { sellerId: string }) {
  const create = useMutation({
    mutationFn: (input: {
      name: string;
      list_price?: number;
      min_price?: number;
      max_negotiation_rounds?: number;
    }) => createSellerAgent({ ...input, seller_id: sellerId }),
    onSuccess: (agent) =>
      toast.success("Negotiation agent created", { description: `Agent ID ${agent.id}` }),
    onError: (error: Error) => toast.error("Couldn't create agent", { description: error.message }),
  });

  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        create.mutate({
          name: String(data.get("agent_name") ?? "Seller agent"),
          list_price: num(data.get("list_price")),
          min_price: num(data.get("min_price")),
          max_negotiation_rounds: num(data.get("max_negotiation_rounds")),
        });
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="agent_name">Agent name</Label>
        <Input id="agent_name" name="agent_name" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="list_price">List price</Label>
        <Input id="list_price" name="list_price" type="number" min={0} step="0.01" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="min_price">Walk-away price</Label>
        <Input id="min_price" name="min_price" type="number" min={0} step="0.01" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="max_negotiation_rounds">Max rounds</Label>
        <Input id="max_negotiation_rounds" name="max_negotiation_rounds" type="number" min={1} />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" variant="outline" disabled={create.isPending}>
          Create negotiation agent
        </Button>
      </div>
    </form>
  );
}

function SellerOrders() {
  const orders = useQuery({ ...myOrdersQuery() });
  if (orders.isPending) return <Skeleton className="h-20 w-full rounded-2xl" />;
  if (orders.isError)
    return <ErrorState title="Couldn't load orders" onRetry={() => orders.refetch()} />;
  if (orders.data.length === 0) return <EmptyState title="No orders yet" />;

  return (
    <ul className="grid gap-3">
      {orders.data.slice(0, 5).map((order) => (
        <li
          key={order.id}
          className="flex items-center justify-between gap-3 rounded-xl border border-border p-4"
        >
          <div className="min-w-0 text-sm">
            <p className="truncate font-semibold text-foreground">Order {order.id}</p>
            <p className="text-muted-foreground">
              {formatCurrency(orderTotal(order), order.currency ?? "USD")}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <StatusBadge status={order.status ?? "pending"} />
            <Button asChild size="sm" variant="outline">
              <Link to="/orders/$orderId" params={{ orderId: order.id }}>
                Manage
              </Link>
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Seller-only workspace: every action maps to a documented backend endpoint. */
export function SellerConsole({ user }: { user: ApiUser | null }) {
  const profile = useQuery({ ...sellerProfileQuery() });
  const sellerId = profile.data?.id ?? profile.data?.user_id ?? null;

  return (
    <div className="space-y-6">
      <SectionHeading
        title={`Seller workspace${user ? ` · ${user.first_name}` : ""}`}
        description="Manage your store profile, listings, inventory, negotiation rules and orders."
      />

      {profile.isPending ? (
        <Skeleton className="h-40 w-full rounded-2xl" />
      ) : (
        <>
          <Panel
            title={profile.data ? "Store profile" : "Set up your store"}
            description={
              profile.data
                ? `${profile.data.is_verified ? "Verified seller" : "Verification pending"}${
                    profile.data.rating ? ` · rating ${profile.data.rating}` : ""
                  }`
                : "Create your seller profile to start listing products."
            }
          >
            <ProfileForm profile={profile.data} />
          </Panel>

          {sellerId ? (
            <>
              <Panel
                title="Negotiation rules"
                description="Your price floor and auto-accept limits guide every AI negotiation."
              >
                <NegotiationConfigForm />
              </Panel>

              <Panel title="Your listings">
                <SellerListings sellerId={sellerId} />
              </Panel>

              <Panel title="Publish a new listing">
                <NewListingForm sellerId={sellerId} />
              </Panel>

              <Panel title="Inventory" description="Adjust available stock per product.">
                <SellerInventory sellerId={sellerId} />
              </Panel>

              <Panel
                title="Negotiation agents"
                description="Create an agent that counters buyer offers for you."
              >
                <SellerAgentPanel sellerId={sellerId} />
              </Panel>

              <Panel title="Recent orders">
                <SellerOrders />
              </Panel>

              <div className="flex flex-wrap gap-3">
                <Button asChild variant="outline">
                  <Link to="/dashboard">All orders</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/">Browse the marketplace</Link>
                </Button>
              </div>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
