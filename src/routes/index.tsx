import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Handshake, ShieldCheck, Sparkles } from "lucide-react";
import { z } from "zod";
import { PageShell } from "@/components/marketplace/page-shell";
import { ProductCard } from "@/components/marketplace/product-card";
import { SectionHeading } from "@/components/marketplace/primitives";
import { EmptyState, ErrorState, ProductGridSkeleton } from "@/components/marketplace/states";
import { Button } from "@/components/ui/button";
import { categoriesQuery, productsQuery } from "@/lib/api/marketplace";

export const Route = createFileRoute("/")({
  validateSearch: z.object({ q: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Haggl — Negotiate prices on a premium marketplace" },
      {
        name: "description",
        content:
          "Browse verified sellers, compare prices and negotiate with AI assistance on Haggl, the marketplace built for fair deals.",
      },
      { property: "og:title", content: "Haggl — Negotiate prices on a premium marketplace" },
      {
        property: "og:description",
        content: "Buy, sell and negotiate smarter with verified sellers and an AI negotiation assistant.",
      },
    ],
  }),
  component: MarketplacePage,
});

const valueProps = [
  {
    icon: Handshake,
    title: "Negotiate in the open",
    body: "Chat directly with sellers, send structured offers and track every counteroffer.",
  },
  {
    icon: Sparkles,
    title: "AI that works for you",
    body: "Get suggested offers and plain-language advice on whether a price is reasonable.",
  },
  {
    icon: ShieldCheck,
    title: "Verified sellers only",
    body: "Ratings, completed sales and response times are visible before you commit.",
  },
];

function MarketplacePage() {
  const { q } = Route.useSearch();
  const products = useQuery(productsQuery(q));
  const categories = useQuery(categoriesQuery());

  return (
    <PageShell>
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand-soft px-3 py-1 text-xs font-medium text-brand">
            <Sparkles className="size-3.5" /> AI-assisted negotiation
          </span>
          <h1 className="mt-5 max-w-2xl text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
            The marketplace where the price is a conversation.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
            Discover products from verified sellers, then buy instantly or open a negotiation with an
            AI assistant in your corner.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/signup">Create an account</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/product/$productId" params={{ productId: "iphone-15-pro" }}>
                See a live negotiation
              </Link>
            </Button>
          </div>
          <ul className="mt-12 grid gap-4 sm:grid-cols-3">
            {valueProps.map((item) => (
              <li key={item.title} className="rounded-xl border border-border bg-background p-4">
                <item.icon className="size-5 text-brand" />
                <h2 className="mt-3 text-sm font-semibold text-foreground">{item.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 sm:py-14">
        <nav aria-label="Categories" className="flex flex-wrap gap-2">
          {(categories.data ?? []).map((c) => (
            <Link
              key={c.id}
              to="/"
              search={{ q: c.label }}
              className="rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-brand/40 hover:text-foreground data-[status=active]:border-brand data-[status=active]:text-foreground"
            >
              {c.label}
            </Link>
          ))}
        </nav>

        <SectionHeading
          title={q ? `Results for “${q}”` : "Trending on Haggl"}
          description={q ? undefined : "Hand-picked listings with active sellers."}
          action={
            q ? (
              <Button asChild variant="ghost" size="sm">
                <Link to="/" search={{}}>
                  Clear filter
                </Link>
              </Button>
            ) : undefined
          }
        />

        {products.isPending ? (
          <ProductGridSkeleton />
        ) : products.isError ? (
          <ErrorState onRetry={() => products.refetch()} />
        ) : products.data.length === 0 ? (
          <EmptyState
            title="No products match that search"
            description="Try a different keyword or browse all categories."
            action={
              <Button asChild variant="outline">
                <Link to="/" search={{}}>
                  Browse everything
                </Link>
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.data.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
