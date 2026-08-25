import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Handshake, Loader2, ShieldCheck, Truck, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import headphonesImage from "@/assets/product-headphones.jpg";
import laptopImage from "@/assets/product-laptop.jpg";
import phoneImage from "@/assets/product-phone.jpg";
import sneakerImage from "@/assets/product-sneaker.jpg";
import watchImage from "@/assets/product-watch.jpg";
import { PageShell } from "@/components/marketplace/page-shell";
import {
  AiTag,
  NegotiableBadge,
  Price,
  Rating,
  SellerBadge,
} from "@/components/marketplace/primitives";
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
        objective: "Negotiate the best price for this product",
      }).catch(() => null);
      return startNegotiation({
        buyer_id: user.id,
        seller_id: product.sellerId,
        product_id: product.id,
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
    onError: (error: Error) =>
      toast.error("Couldn't start negotiation", { description: error.message }),
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
          <Button
            type="submit"
            variant="negotiate"
            className="w-full"
            disabled={mutation.isPending}
          >
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
      await createBuyerAgent({
        objective: "Negotiate the best price for this product",
      }).catch(() => null);
      return startNegotiation({
        buyer_id: user.id,
        seller_id: product.sellerId,
        product_id: product.id,
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
    <Button
      size="lg"
      className="flex-1"
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
    >
      {mutation.isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Zap className="size-4" />
      )}
      Buy at asking price
    </Button>
  );
}

const categoryImages: Record<string, string> = {
  Electronics: headphonesImage,
  Phones: phoneImage,
  Computers: laptopImage,
  Fashion: sneakerImage,
  Home: watchImage,
  Sports: sneakerImage,
  Beauty: watchImage,
  Gaming: laptopImage,
};

function ProductDetailContent({ product: p }: { product: Product }) {
  const image = p.image ?? categoryImages[p.category] ?? headphonesImage;
  const sellerName = p.brand || "Marketplace seller";

  return (
    <>
      <section className="grid overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-soft lg:grid-cols-[minmax(0,1.05fr)_minmax(24rem,0.95fr)]">
        <div className="relative min-h-[23rem] overflow-hidden bg-muted sm:min-h-[34rem]">
          <img src={image} alt={p.name} className="size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/45 via-transparent to-transparent" />
          <div className="absolute left-5 top-5 sm:left-7 sm:top-7">
            <NegotiableBadge />
          </div>
          <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4 text-background sm:bottom-7 sm:left-7 sm:right-7">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-background/70">
                {p.category}
              </p>
              <p className="mt-1 text-sm text-background/85">Authentic marketplace listing</p>
            </div>
            <span className="rounded-full border border-background/30 bg-background/15 px-3 py-1 text-xs backdrop-blur-sm">
              {p.stock !== null ? `${p.stock} in stock` : "Available"}
            </span>
          </div>
        </div>
        <div className="flex flex-col justify-center gap-6 p-6 sm:p-10 lg:p-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <span>{p.category}</span>
              <span className="size-1 rounded-full bg-accent-amber" />
              <span>Listing details</span>
            </div>
            <h1 className="max-w-xl text-4xl font-semibold leading-[0.98] tracking-[-0.04em] text-foreground sm:text-5xl">
              {p.name}
            </h1>
            {p.rating !== null ? <Rating value={p.rating} /> : null}
          </div>
          <div className="border-y border-border/70 py-5">
            <p className="mb-1 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Asking price
            </p>
            <Price amount={p.price} currency={p.currency} size="xl" className="block" />
            <p className="mt-2 text-sm text-muted-foreground">
              {p.stock !== null ? `${p.stock} available` : "Availability confirmed at checkout"}
            </p>
          </div>
          <SellerBadge seller={{ name: sellerName, verified: Boolean(p.sellerId) }} />
          <div className="flex flex-col gap-3 sm:flex-row">
            <BuyNowButton product={p} />
            <NegotiateDialog product={p} />
          </div>
          <p className="text-center text-xs text-muted-foreground sm:text-left">
            Buy at asking price or let your AI agent negotiate within your limit.
          </p>
        </div>
      </section>
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(19rem,0.42fr)]">
        <div className="surface space-y-4 p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4 border-b border-border/70 pb-4">
            <h2 className="text-xl font-semibold tracking-[-0.02em] text-foreground">
              About this listing
            </h2>
            <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
              Details
            </span>
          </div>
          {p.description ? (
            <p className="max-w-3xl whitespace-pre-line text-sm leading-7 text-muted-foreground">
              {p.description}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No additional description was provided.</p>
          )}
        </div>
        <div className="surface space-y-5 p-6 sm:p-8">
          <AiTag label="Protected negotiation" />
          <ul className="space-y-4 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <Handshake className="mt-0.5 size-4 shrink-0 text-negotiate" />
              <span>Send an opening offer and private walk-away limit.</span>
            </li>
            <li className="flex gap-3">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" />
              <span>The seller's agent can accept, counter or reject.</span>
            </li>
            <li className="flex gap-3">
              <Truck className="mt-0.5 size-4 shrink-0 text-brand" />
              <span>Place your order once both sides agree.</span>
            </li>
          </ul>
        </div>
      </section>
      <section className="surface p-6 sm:p-8">
        <h2 className="text-xl font-semibold tracking-[--0.02em] text-foreground">Listing facts</h2>
        <dl className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Product", p.name],
            ["Category", p.category],
            ["Brand / seller", sellerName],
            ["Currency", p.currency],
            ["Stock", p.stock !== null ? `${p.stock} available` : "Confirmed at checkout"],
            ["Rating", p.rating !== null ? `${p.rating} / 5` : "Not rated yet"],
            ["Listing ID", p.id],
          ].map(([label, value]) => (
            <div key={label} className="min-w-0 border-t border-border/70 pt-3">
              <dt className="text-xs uppercase tracking-[0.1em] text-muted-foreground">{label}</dt>
              <dd className="mt-1 truncate text-sm font-medium text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
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

        <ProductDetailContent product={p} />
        <div className="hidden">
          <div className="surface space-y-4 p-6">
            <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Listing details
            </h2>
            <dl className="space-y-3 text-sm">
              {[
                ["Product", p.name],
                ["Category", p.category],
                ["Brand / seller", p.brand || "Marketplace seller"],
                ["Asking price", formatCurrency(p.price, p.currency)],
                ["Currency", p.currency],
                ["Stock", p.stock !== null ? `${p.stock} available` : "Confirmed at checkout"],
                ["Rating", p.rating !== null ? `${p.rating} / 5` : "Not rated yet"],
                ["Listing ID", p.id],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-start justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0"
                >
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="text-right font-medium text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
                {p.category}
              </span>
              <NegotiableBadge />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {p.name}
            </h1>
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
