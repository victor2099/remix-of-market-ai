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
import {
  normalizeBuyerAgentRecommendation,
  type RecommendationResult,
} from "@/lib/api/recommendations";
import { createBuyerAgent, triggerBuyerAgentRecommendation } from "@/lib/api/negotiations";
import { useSession } from "@/hooks/use-session";
import type { Agent } from "@/types/api";
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
    max:
      search["max"] != null && !Number.isNaN(Number(search["max"]))
        ? Number(search["max"])
        : undefined,
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

type BuyerAgentRunRecord = {
  id: string;
  agent: Agent;
  request: { objective: string; max_budget?: number };
  result: RecommendationResult;
  createdAt: string;
};

function persistBuyerAgentRun(userId: string, run: BuyerAgentRunRecord) {
  const key = `haggl:buyer-agent-history:${userId}`;
  try {
    const previous = JSON.parse(window.localStorage.getItem(key) ?? "[]") as unknown;
    const history = Array.isArray(previous) ? (previous as BuyerAgentRunRecord[]) : [];
    window.localStorage.setItem(key, JSON.stringify([run, ...history].slice(0, 20)));
    window.localStorage.setItem(`haggl:buyer-agent:${userId}`, String(run.agent.id));
  } catch {
    // Recommendations still render if browser storage is unavailable.
  }
}

function AiPicks() {
  const { user, isAuthenticated } = useSession();
  const isBuyer = isAuthenticated && user?.role === "buyer";
  const [intent, setIntent] = useState("");
  const [budget, setBudget] = useState("");
  const [result, setResult] = useState<RecommendationResult | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const agent = await createBuyerAgent({
        objective: intent.trim(),
        ...(parseAmountInput(budget) ? { max_budget: parseAmountInput(budget) } : {}),
      });
      const response = await triggerBuyerAgentRecommendation(String(agent.id), {
        objective: intent.trim(),
        ...(parseAmountInput(budget) ? { max_budget: parseAmountInput(budget) } : {}),
      });
      return { agent, result: normalizeBuyerAgentRecommendation(response) };
    },
    onSuccess: ({ agent, result: value }) => {
      setResult(value);
      if (user) {
        persistBuyerAgentRun(user.id, {
          id: `${agent.id}-${Date.now()}`,
          agent,
          request: {
            objective: intent.trim(),
            ...(parseAmountInput(budget) ? { max_budget: parseAmountInput(budget) } : {}),
          },
          result: value,
          createdAt: new Date().toISOString(),
        });
      }
    },
  });

  return (
    <section className="relative overflow-hidden rounded-[1.75rem] bg-foreground p-5 text-background shadow-raised sm:p-7">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(255,255,255,0.14),transparent_35%),radial-gradient(circle_at_90%_100%,rgba(103,232,249,0.12),transparent_32%)]" />
      <div className="relative">
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
            if (intent.trim().length < 3 || !isBuyer) return;
            mutation.mutate();
          }}
        >
          <Input
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            placeholder="A quiet laptop for design work"
            className="h-12 rounded-xl border-background/15 bg-background/10 text-background placeholder:text-background/45"
            aria-label="What are you looking for?"
          />
          <Input
            value={budget}
            onChange={(e) => setBudget(formatAmountInput(e.target.value))}
            placeholder="Budget"
            inputMode="numeric"
            className="h-12 rounded-xl border-background/15 bg-background/10 text-background placeholder:text-background/45"
            aria-label="Budget"
          />
          <Button
            type="submit"
            variant="ai"
            className="h-12 bg-background text-foreground hover:bg-background/90"
            disabled={mutation.isPending || !isBuyer}
          >
            {mutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            {mutation.isPending ? "Thinking…" : "Get picks"}
          </Button>
        </form>
        {!isAuthenticated ? (
          <p className="relative z-10 mt-3 text-xs text-background/60">
            <Link to="/signin" className="font-medium text-brand hover:underline">
              Sign in
            </Link>{" "}
            to get personalised recommendations.
          </p>
        ) : !isBuyer ? (
          <p className="relative z-10 mt-3 text-xs text-background/60">
            Sign in with a buyer account to use buyer agents.
          </p>
        ) : null}
        {result ? (
          <div className="relative z-10 mt-6 space-y-3 border-t border-background/15 pt-5">
            {result.summary ? <p className="text-sm text-foreground">{result.summary}</p> : null}
            {result.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No matches yet — try a broader description.
              </p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {result.items.map((item) => (
                  <li
                    key={item.key}
                    className="rounded-xl border border-background/15 bg-background/10 p-4"
                  >
                    <p className="text-sm font-semibold text-background">{item.name}</p>
                    {item.reason ? (
                      <p className="mt-1 text-sm text-background/65">{item.reason}</p>
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
      </div>
    </section>
  );
}

function HomePage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSession();
  const dashboardPath = isAuthenticated && user?.role === "seller" ? "/seller" : "/buyer";
  const products = useQuery(
    productsQuery({ query: search.q, category: search.category, maxPrice: search.max }),
  );

  const setCategory = (category?: string) => navigate({ to: "/", search: { ...search, category } });

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl space-y-20 px-4 pb-12 pt-8 sm:px-6 sm:pb-20 sm:pt-12">
        <section className="editorial-grid rounded-[2rem] px-4 py-14 sm:px-10 sm:py-20">
          <div className="mx-auto max-w-4xl text-center">
            <AiTag label="The marketplace where prices move" />
            <h1 className="mx-auto mt-6 max-w-4xl text-5xl font-semibold leading-[0.98] tracking-[-0.04em] text-foreground sm:text-7xl">
              Find it. Ask for less. Let AI handle the{" "}
              <em className="text-accent-amber">haggle.</em>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Haggl connects buyers and sellers through intelligent agents that search the
              marketplace, recommend the right fit and negotiate within real limits.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <Link to="/categories">Explore the marketplace</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to={dashboardPath}>Your dashboard</Link>
              </Button>
            </div>
          </div>
          <div className="mx-auto mt-14 max-w-5xl">
            <div className="relative overflow-hidden rounded-[1.75rem] bg-foreground p-3 text-background shadow-raised sm:p-5">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.16),transparent_34%),radial-gradient(circle_at_80%_90%,rgba(103,232,249,0.16),transparent_32%)]" />
              <div className="relative grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                <div className="rounded-2xl border border-background/15 bg-background/10 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-background/50">
                    You say
                  </p>
                  <p className="mt-4 text-xl font-medium leading-tight">
                    “A quiet laptop for design work under ₦800k.”
                  </p>
                  <p className="mt-5 flex items-center gap-2 text-xs text-background/60">
                    <span className="size-2 rounded-full bg-accent-teal" />
                    Buyer brief created
                  </p>
                </div>
                <div className="flex justify-center text-background/50">
                  <ArrowRight className="size-7 rotate-90 sm:rotate-0" />
                </div>
                <div className="rounded-2xl border border-background/15 bg-background/10 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-background/50">
                    Haggl finds
                  </p>
                  <div className="mt-4 space-y-3">
                    {["MacBook Air M2 · 94% fit", "Dell XPS 13 · 89% fit"].map((item, index) => (
                      <div
                        key={item}
                        className="flex items-center justify-between gap-3 rounded-xl bg-background/10 px-3 py-2 text-sm"
                      >
                        <span>{item}</span>
                        <span className={index === 0 ? "text-accent-teal" : "text-background/50"}>
                          View
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-5 flex items-center gap-2 text-xs text-background/60">
                    <span className="size-2 rounded-full bg-accent-pink" />
                    Seller agent ready to negotiate
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-3xl">
          <AiPicks />
        </section>
        <section className="hidden grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-center">
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
                <Link to={dashboardPath}>Your dashboard</Link>
              </Button>
            </div>
          </div>
          <AiPicks />
        </section>

        <section className="space-y-5">
          <SectionHeading
            title={search.q ? `Results for “${search.q}”` : "Live listings"}
            description="Browse real listings, then let your buyer agent find the strongest fit."
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
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
