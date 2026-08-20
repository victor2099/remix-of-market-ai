import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { PageShell } from "@/components/marketplace/page-shell";
import { SectionHeading } from "@/components/marketplace/primitives";
import { EmptyState, ErrorState } from "@/components/marketplace/states";
import { Panel, SellerGate, num, useSellerProfile } from "@/components/marketplace/seller-parts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/hooks/use-session";
import {
  CATEGORIES,
  createInventory,
  createProduct,
  deactivateProduct,
  sellerProductsQuery,
  updateProduct,
} from "@/lib/api/products";
import { formatCurrency } from "@/lib/format";
import type { Product } from "@/types/api";

export const Route = createFileRoute("/seller/products")({
  head: () => ({
    meta: [
      { title: "Your products — Haggl seller" },
      {
        name: "description",
        content:
          "Create a product, update its price and details, deactivate a listing and review every product you have published.",
      },
      { property: "og:title", content: "Your products — Haggl seller" },
      { property: "og:description", content: "Create, update and deactivate your Haggl listings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SellerProductsPage,
});

function CategorySelect({ id, defaultValue }: { id: string; defaultValue?: string }) {
  return (
    <select
      id={id}
      name="category"
      defaultValue={defaultValue ?? CATEGORIES[0]}
      className="h-10 rounded-xl border border-input bg-card px-3 text-sm text-foreground"
    >
      {CATEGORIES.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}

function NewProductForm({ sellerId }: { sellerId: string }) {
  const qc = useQueryClient();
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
      toast.success("Product created");
      void qc.invalidateQueries({ queryKey: ["seller-products", sellerId] });
      void qc.invalidateQueries({ queryKey: ["seller-inventory", sellerId] });
      void qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: Error) => toast.error("Couldn't create product", { description: error.message }),
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
            quantity: num(data.get("quantity")) ?? 0,
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
        <CategorySelect id="category" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="quantity">Starting stock</Label>
        <Input id="quantity" name="quantity" type="number" min={0} defaultValue={1} />
      </div>
      <div className="grid gap-2 sm:col-span-2">
        <Label htmlFor="product-description">Description</Label>
        <Textarea id="product-description" name="description" required />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={create.isPending}>
          Create product
        </Button>
      </div>
    </form>
  );
}

function EditProductForm({ product, sellerId }: { product: Product; sellerId: string }) {
  const qc = useQueryClient();
  const save = useMutation({
    mutationFn: (input: Parameters<typeof updateProduct>[1]) => updateProduct(product.id, input),
    onSuccess: () => {
      toast.success("Product updated");
      void qc.invalidateQueries({ queryKey: ["seller-products", sellerId] });
      void qc.invalidateQueries({ queryKey: ["product", product.id] });
    },
    onError: (error: Error) => toast.error("Couldn't update product", { description: error.message }),
  });

  return (
    <form
      className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        save.mutate({
          name: String(data.get("name") ?? ""),
          description: String(data.get("description") ?? ""),
          price: num(data.get("price")) ?? product.price,
          category: String(data.get("category") ?? product.category),
        });
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor={`name-${product.id}`}>Name</Label>
        <Input id={`name-${product.id}`} name="name" defaultValue={product.name} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`price-${product.id}`}>Price</Label>
        <Input
          id={`price-${product.id}`}
          name="price"
          type="number"
          min={0}
          step="0.01"
          defaultValue={product.price}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`category-${product.id}`}>Category</Label>
        <CategorySelect id={`category-${product.id}`} defaultValue={product.category} />
      </div>
      <div className="grid gap-2 sm:col-span-2">
        <Label htmlFor={`desc-${product.id}`}>Description</Label>
        <Textarea id={`desc-${product.id}`} name="description" defaultValue={product.description} />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" size="sm" disabled={save.isPending}>
          Save changes
        </Button>
      </div>
    </form>
  );
}

function ProductList({ sellerId }: { sellerId: string }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const products = useQuery({ ...sellerProductsQuery(sellerId), retry: false });
  const remove = useMutation({
    mutationFn: (productId: string) => deactivateProduct(productId),
    onSuccess: () => {
      toast.success("Product deactivated");
      void qc.invalidateQueries({ queryKey: ["seller-products", sellerId] });
      void qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: Error) => toast.error("Couldn't deactivate", { description: error.message }),
  });

  if (products.isPending) return <Skeleton className="h-24 w-full rounded-2xl" />;
  if (products.isError)
    return <ErrorState title="Couldn't load your products" onRetry={() => products.refetch()} />;
  if (products.data.length === 0)
    return <EmptyState title="No products yet" description="Create your first product below." />;

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
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button asChild size="sm" variant="ghost">
                <Link to="/product/$productId" params={{ productId: product.id }}>
                  View
                </Link>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditing(editing === product.id ? null : product.id)}
              >
                {editing === product.id ? "Close" : "Update"}
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
          {editing === product.id ? (
            <EditProductForm product={product} sellerId={sellerId} />
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function SellerProductsPage() {
  const { user, isAuthenticated } = useSession();
  const { profile, sellerId } = useSellerProfile();

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6 sm:py-14">
        <SectionHeading
          title="Products"
          description="Create, update and deactivate the listings buyers negotiate on."
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
              description="You need a seller profile before publishing products."
              action={
                <Button asChild>
                  <Link to="/seller">Set up store profile</Link>
                </Button>
              }
            />
          ) : (
            <>
              <Panel title="Create a product">
                <NewProductForm sellerId={sellerId} />
              </Panel>
              <Panel title="Your products">
                <ProductList sellerId={sellerId} />
              </Panel>
            </>
          )}
        </SellerGate>
      </div>
    </PageShell>
  );
}
