import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { PageShell } from "@/components/marketplace/page-shell";
import { AiTag, SectionHeading } from "@/components/marketplace/primitives";
import { ProductCard } from "@/components/marketplace/product-card";
import { EmptyState, ErrorState, ProductGridSkeleton } from "@/components/marketplace/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CATEGORIES, productsQuery } from "@/lib/api/products";
import { getRecommendations } from "@/lib/api/recommendations";
import type { RecommendationResult } from "@/lib/api/recommendations";
import { useSession } from "@/hooks/use-session";
import { parseAmountInput, formatAmountInput } from "@/lib/format";

interface HomeSearch {
  q?: string | undefined;
  category?: string | undefined;
  max?: number | undefined;
}

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): HomeSearch => ({
    q: typeof search["q"] === "string" && search["q"] ? search["q"] : undefined,
    category:
      typeof search["category"] === "string" && search["category"] ? search["category"] : undefined,
    max: search["max"] != null && !Number.isNaN(Number(search["max"])) ? Number(search["max"]) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Haggl — Negotiate every price with AI agents" },
      {
        name: "description",
        content:
          "Browse verified listings and let your AI buyer agent negotiate the price with the seller's agent in real time.",
      },
      { property: "og:title", content: "Haggl — Negotiate every price with AI agents" },
      {
        property: "og:description",
        content: "AI-powered marketplace where every listing is negotiable.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function AiPicks() {
  const { isAuthenticated } = useSession();
  const [intent, setIntent] = useState("");
  const [budget, setBudget] = useState("");
  const [result, setResult] = useState<RecommendationResult | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      getRecommendations({
        intent: intent.trim(),
        budget: parseAmountInput(budget) || null,
      }),
    onSuccess: setResult,
  });

  return (
    <section className="surface p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <AiTag label="AI shopping assistant" />
        <p className="text-sm text-muted-foreground">
          Describe what you need and your budget — we&apos;ll shortlist the best listings.
        </p>
      </div>
      <form
        className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          if (intent.trim().length < 3) return;
          mutation.mutate();
        }}
      >
        <Input
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          placeholder="A quiet laptop for design work"
          className="h-11 rounded-xl"
          aria-label="What are you looking for?"
        />
        <Input
          value={budget}
          onChange={(e) => setBudget(formatAmountInput(e.target.value))}
          placeholder="Budget"
          inputMode="numeric"
          className="h-11 rounded-xl"
          aria-label="Budget"
        />
        <Button type="submit" variant="ai" className="h-11" disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {mutation.isPending ? "Thinking…" : "Get picks"}
        </Button>
      </form>
      {!isAuthenticated ? (
        <p className="mt-3 text-xs text-muted-foreground">
          <Link to="/signin" className="font-medium text-brand hover:underline">
            Sign in
          </Link>{" "}
          to get personalised recommendations.
        </p>
      ) : null}
      {result ? (
        <div className="mt-5 space-y-3 border-t border-border pt-5">
          {result.summary ? <p className="text-sm text-foreground">{result.summary}</p> : null}
          {result.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No matches yet — try a broader description.</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {result.items.map((item) => (
                <li key={item.key} className="rounded-xl border border-border bg-background p-4">
                  <p className="text-sm font-semibold text-foreground">{item.name}</p>
                  {item.reason ? (
                    <p className="mt-1 text-sm text-muted-foreground">{item.reason}</p>
                  ) : null}
                  {item.productId ? (
                    <Link
                      to="/product/$productId"
                      params={{ productId: item.productId }}
                      className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
                    >
                      View listing <ArrowRight className="size-3.5" />
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </section>
  );
}

function HomePage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const products = useQuery(
    productsQuery({ query: search.q, category: search.category, maxPrice: search.max }),
  );

  const setCategory = (category?: string) =>
    navigate({ to: "/", search: { ...search, category } });

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6 sm:py-12">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-center">
          <div>
            <AiTag label="Agent-to-agent negotiation" />
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Every price here is a starting point.
            </h1>
            <p className="mt-3 max-w-xl text-base text-muted-foreground">
              Set your budget, send an offer and let your buyer agent haggle with the seller&apos;s
              agent until you land a price you like.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/categories">Browse categories</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/dashboard">Your dashboard</Link>
              </Button>
            </div>
          </div>
          <AiPicks />
        </section>

        <section className="space-y-5">
          <SectionHeading
            title={search.q ? `Results for “${search.q}”` : "Live listings"}
            description="Prices update as sellers tune their negotiation limits."
          />
          <div className="flex flex-wrap gap-2">
            <Button
              variant={search.category ? "outline" : "default"}
              size="sm"
              onClick={() => setCategory(undefined)}
            >
              All
            </Button>
            {CATEGORIES.map((category) => (
              <Button
                key={category}
                size="sm"
                variant={search.category === category ? "default" : "outline"}
                onClick={() => setCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>

          {products.isError ? (
            <ErrorState
              title="Couldn't load listings"
              description="The marketplace API didn't respond. Check that the backend is running."
              onRetry={() => products.refetch()}
            />
          ) : products.isPending ? (
            <ProductGridSkeleton count={8} />
          ) : products.data.length === 0 ? (
            <EmptyState
              title="No listings match your filters"
              description="Try another category or clear your search."
              action={
                <Button variant="outline" onClick={() => navigate({ to: "/", search: {} })}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.data.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
}
