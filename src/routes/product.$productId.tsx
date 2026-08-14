import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Handshake, MessageSquare, PackageCheck, ShieldCheck, Truck } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/marketplace/page-shell";
import { ProductCard } from "@/components/marketplace/product-card";
import {
  NegotiableBadge,
  Price,
  Rating,
  SectionHeading,
  SellerBadge,
} from "@/components/marketplace/primitives";
import { EmptyState, ErrorState, ProductDetailSkeleton } from "@/components/marketplace/states";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { productQuery, similarProductsQuery } from "@/lib/api/marketplace";

export const Route = createFileRoute("/product/$productId")({
  head: () => ({
    meta: [
      { title: "Product details — Haggl" },
      {
        name: "description",
        content:
          "See the price, seller rating and availability, then buy now or open a negotiation with AI assistance.",
      },
      { property: "og:title", content: "Product details — Haggl" },
      {
        property: "og:description",
        content: "Buy instantly or negotiate the price with a verified seller.",
      },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { productId } = Route.useParams();
  const product = useQuery(productQuery(productId));
  const similar = useQuery(similarProductsQuery(productId));

  if (product.isPending) {
    return (
      <PageShell>
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <ProductDetailSkeleton />
        </div>
      </PageShell>
    );
  }

  if (product.isError || !product.data) {
    return (
      <PageShell>
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <ErrorState
            title="We couldn't load this product"
            description="The listing may have been removed or the link is incorrect."
            onRetry={() => product.refetch()}
          />
        </div>
      </PageShell>
    );
  }

  const p = product.data;
  const inStock = p.inStock > 0;

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:pb-16">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/" search={{ q: p.category }}>
                  {p.category}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{p.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-12">
          <div className="space-y-3">
            <div className="surface overflow-hidden">
              <img
                src={p.image}
                alt={p.name}
                width={1024}
                height={1024}
                className="aspect-square w-full object-cover"
              />
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`View image ${i + 1}`}
                  aria-current={i === 0}
                  className="surface cursor-pointer overflow-hidden p-0 transition-colors aria-[current=true]:border-brand"
                >
                  <img
                    src={p.image}
                    alt=""
                    loading="lazy"
                    width={256}
                    height={256}
                    className="aspect-square w-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {p.category}
              </span>
              {p.negotiable ? <NegotiableBadge /> : null}
            </div>
            <h1 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">
              {p.name}
            </h1>
            <Rating value={p.rating} count={p.reviewCount} className="mt-3" />

            <div className="mt-6">
              <Price amount={p.price} currency={p.currency} size="xl" />
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span className={inStock ? "font-medium text-success" : "font-medium text-destructive"}>
                  {inStock ? `In stock · ${p.inStock} available` : "Out of stock"}
                </span>
                <span>{p.condition}</span>
                <span>{p.location}</span>
              </p>
            </div>

            <div className="surface mt-6 p-4">
              <SellerBadge seller={p.seller} showRating />
              <p className="mt-3 text-xs text-muted-foreground">
                {p.seller.sales.toLocaleString()} completed sales · Responds {p.seller.responseTime.toLowerCase()}
              </p>
            </div>

            <ul className="mt-6 space-y-2 text-sm text-foreground">
              {p.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2">
                  <PackageCheck className="mt-0.5 size-4 shrink-0 text-brand" />
                  {h}
                </li>
              ))}
            </ul>

            <div className="mt-7 hidden gap-3 lg:flex">
              <Button
                size="lg"
                className="flex-1"
                disabled={!inStock}
                onClick={() => toast.success("Added to checkout", { description: p.name })}
              >
                Buy now
              </Button>
              {p.negotiable ? (
                <Button asChild size="lg" variant="negotiate" className="flex-1">
                  <Link to="/negotiate/$productId" params={{ productId: p.id }}>
                    <Handshake /> Negotiate
                  </Link>
                </Button>
              ) : null}
            </div>

            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-success" /> Escrow protected
              </span>
              <span className="flex items-center gap-1.5">
                <Truck className="size-3.5" /> Ships in 24 hours
              </span>
              <span className="flex items-center gap-1.5">
                <MessageSquare className="size-3.5" /> Direct seller chat
              </span>
            </div>
          </div>
        </div>

        <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-12">
          <div className="space-y-10">
            <section>
              <SectionHeading title="Product description" />
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.description}</p>
            </section>

            <section>
              <SectionHeading title="Specifications" />
              <dl className="surface mt-4 divide-y divide-border">
                {p.specs.map((spec) => (
                  <div
                    key={spec.label}
                    className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-4 px-4 py-3 text-sm"
                  >
                    <dt className="text-muted-foreground">{spec.label}</dt>
                    <dd className="font-medium text-foreground">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section>
              <SectionHeading title={`Reviews (${p.reviewCount})`} />
              {p.reviews.length === 0 ? (
                <div className="mt-4">
                  <EmptyState
                    title="No written reviews yet"
                    description="Buyers have rated this listing but haven't left written feedback."
                  />
                </div>
              ) : (
                <ul className="mt-4 space-y-3">
                  {p.reviews.map((review) => (
                    <li key={review.id} className="surface p-4">
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                        <p className="truncate text-sm font-semibold text-foreground">{review.author}</p>
                        <Rating value={review.rating} compact />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{review.createdAt}</p>
                      <p className="mt-3 text-sm leading-relaxed text-foreground">{review.body}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <aside>
            <SectionHeading title="Seller information" />
            <div className="surface mt-4 p-5">
              <SellerBadge seller={p.seller} />
              <dl className="mt-5 space-y-3 text-sm">
                {[
                  ["Verification", p.seller.verified ? "Verified seller" : "Not verified"],
                  ["Rating", `${p.seller.rating.toFixed(1)} / 5`],
                  ["Completed sales", p.seller.sales.toLocaleString()],
                  ["Response time", p.seller.responseTime],
                  ["Member since", p.seller.memberSince],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="text-right font-medium text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
              {p.negotiable ? (
                <Button asChild variant="outline" className="mt-5 w-full">
                  <Link to="/negotiate/$productId" params={{ productId: p.id }}>
                    Message seller
                  </Link>
                </Button>
              ) : null}
            </div>
          </aside>
        </div>

        <section className="mt-14">
          <SectionHeading
            title="Similar products"
            description="Other listings buyers negotiated on recently."
          />
          <div className="mt-5 -mx-4 flex snap-x gap-5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
            {(similar.data ?? []).map((item) => (
              <div key={item.id} className="w-[75vw] shrink-0 snap-start sm:w-auto">
                <ProductCard product={item} />
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 flex gap-3 border-t border-border bg-card/95 p-3 backdrop-blur lg:hidden">
        <Button
          className="flex-1"
          size="lg"
          disabled={!inStock}
          onClick={() => toast.success("Added to checkout", { description: p.name })}
        >
          Buy now
        </Button>
        {p.negotiable ? (
          <Button asChild size="lg" variant="negotiate" className="flex-1">
            <Link to="/negotiate/$productId" params={{ productId: p.id }}>
              Negotiate
            </Link>
          </Button>
        ) : null}
      </div>
    </PageShell>
  );
}
