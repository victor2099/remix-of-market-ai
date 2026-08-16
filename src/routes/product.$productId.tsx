import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Handshake, Loader2, ShieldCheck, Truck, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageShell } from "@/components/marketplace/page-shell";
import { AiTag, NegotiableBadge, Price, Rating } from "@/components/marketplace/primitives";
import { ProductThumb } from "@/components/marketplace/product-card";
import { ErrorState, ProductDetailSkeleton } from "@/components/marketplace/states";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/hooks/use-session";
import { productQuery } from "@/lib/api/products";
import { createBuyerAgent, startNegotiation } from "@/lib/api/negotiations";
import { formatAmountInput, formatCurrency, parseAmountInput } from "@/lib/format";
import type { Product } from "@/types/api";

export const Route = createFileRoute("/product/$productId")({
  head: () => ({
    meta: [
      { title: "Listing details — Haggl" },
      {
        name: "description",
        content: "See the asking price, seller details and start an AI-assisted negotiation.",
      },
      { property: "og:title", content: "Listing details — Haggl" },
      {
        property: "og:description",
        content: "Review the listing and open a negotiation with the seller's agent.",
      },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductPage,
});

function NegotiateDialog({ product }: { product: Product }) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSession();
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState("1");
  const [offer, setOffer] = useState(formatAmountInput(String(Math.round(product.price * 0.85))));
  const [maxPrice, setMaxPrice] = useState(formatAmountInput(String(Math.round(product.price))));

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in first");
      if (!product.sellerId) throw new Error("This listing has no seller attached");
      // The backend needs a buyer agent before it can negotiate on your behalf.
      await createBuyerAgent({
        user_id: user.id,
        buyer_id: user.id,
        strategy: "balanced",
      }).catch(() => null);
      return startNegotiation({
        buyer_id: user.id,
        seller_id: product.sellerId,
        product_id: product.id,
        quantity: Math.max(1, Number(quantity) || 1),
        initial_offer: parseAmountInput(offer),
        max_price: parseAmountInput(maxPrice),
        currency: product.currency,
      });
    },
    onSuccess: (negotiation) => {
      setOpen(false);
      toast.success("Negotiation started", { description: "Your agent is on it." });
      navigate({ to: "/negotiations/$negotiationId", params: { negotiationId: negotiation.id } });
    },
    onError: (error: Error) => toast.error("Couldn't start negotiation", { description: error.message }),
  });

  if (!isAuthenticated) {
    return (
      <Button asChild size="lg" variant="negotiate" className="flex-1">
        <Link to="/signin">
          <Handshake className="size-4" /> Sign in to negotiate
        </Link>
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" variant="negotiate" className="flex-1">
          <Handshake className="size-4" /> Negotiate
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start a negotiation</DialogTitle>
          <DialogDescription>
            Asking price is {formatCurrency(product.price, product.currency)}. Your agent will never
            go above your max price.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (parseAmountInput(offer) <= 0 || parseAmountInput(maxPrice) <= 0) {
              toast.error("Enter an opening offer and a max price");
              return;
            }
            mutation.mutate();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="neg-offer">Opening offer</Label>
              <Input
                id="neg-offer"
                inputMode="numeric"
                value={offer}
                onChange={(e) => setOffer(formatAmountInput(e.target.value))}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="neg-max">Max price (walk-away)</Label>
              <Input
                id="neg-max"
                inputMode="numeric"
                value={maxPrice}
                onChange={(e) => setMaxPrice(formatAmountInput(e.target.value))}
                className="h-11 rounded-xl"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="neg-qty">Quantity</Label>
            <Input
              id="neg-qty"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="h-11 w-28 rounded-xl"
            />
          </div>
          <Button type="submit" variant="negotiate" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {mutation.isPending ? "Starting…" : "Send opening offer"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BuyNowButton({ product }: { product: Product }) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSession();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in first");
      if (!product.sellerId) throw new Error("This listing has no seller attached");
      await createBuyerAgent({ user_id: user.id, buyer_id: user.id }).catch(() => null);
      return startNegotiation({
        buyer_id: user.id,
        seller_id: product.sellerId,
        product_id: product.id,
        quantity: 1,
        initial_offer: product.price,
        max_price: product.price,
        currency: product.currency,
      });
    },
    onSuccess: (negotiation) =>
      navigate({ to: "/negotiations/$negotiationId", params: { negotiationId: negotiation.id } }),
    onError: (error: Error) => toast.error("Couldn't continue", { description: error.message }),
  });

  if (!isAuthenticated) {
    return (
      <Button asChild size="lg" className="flex-1">
        <Link to="/signin">Sign in to buy</Link>
      </Button>
    );
  }

  return (
    <Button size="lg" className="flex-1" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
      {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4" />}
      Buy at asking price
    </Button>
  );
}

function ProductPage() {
  const { productId } = Route.useParams();
  const product = useQuery(productQuery(productId));

  if (product.isError) {
    return (
      <PageShell>
        <div className="mx-auto max-w-3xl px-4 py-16">
          <ErrorState
            title="This listing isn't available"
            description="It may have been removed or is no longer active."
            onRetry={() => product.refetch()}
          />
        </div>
      </PageShell>
    );
  }

  if (product.isPending) {
    return (
      <PageShell>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <ProductDetailSkeleton />
        </div>
      </PageShell>
    );
  }

  const p = product.data;

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Marketplace</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/" search={{ category: p.category }}>
                  {p.category}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="line-clamp-1">{p.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="surface overflow-hidden">
            <ProductThumb src={p.image} alt={p.name} />
          </div>

          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
                {p.category}
              </span>
              <NegotiableBadge />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{p.name}</h1>
            {p.rating !== null ? <Rating value={p.rating} /> : null}
            <Price amount={p.price} currency={p.currency} size="xl" className="block" />
            <p className="text-sm text-muted-foreground">
              {p.stock !== null ? `${p.stock} available` : "Availability confirmed at checkout"}
              {p.brand ? ` · ${p.brand}` : ""}
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <BuyNowButton product={p} />
              <NegotiateDialog product={p} />
            </div>

            <div className="surface space-y-3 p-5">
              <AiTag label="How negotiation works" />
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <Handshake className="mt-0.5 size-4 shrink-0 text-negotiate" />
                  Send an opening offer and a private walk-away limit.
                </li>
                <li className="flex gap-2">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" />
                  The seller&apos;s agent replies with accept, counter or reject.
                </li>
                <li className="flex gap-2">
                  <Truck className="mt-0.5 size-4 shrink-0 text-brand" />
                  Once accepted, place the order at the agreed price.
                </li>
              </ul>
            </div>

            {p.description ? (
              <div className="space-y-2">
                <h2 className="text-sm font-semibold text-foreground">About this listing</h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {p.description}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
