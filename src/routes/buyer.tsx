import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageShell } from "@/components/marketplace/page-shell";
import { SectionHeading, StatusBadge } from "@/components/marketplace/primitives";
import { UserAvatar } from "@/components/marketplace/user-avatar";
import { EmptyState, ErrorState } from "@/components/marketplace/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/hooks/use-session";
import {
  createBuyerAgent,
  getBuyerAgent,
  triggerBuyerAgentRecommendation,
} from "@/lib/api/negotiations";
import { myOrdersQuery, orderTotal } from "@/lib/api/orders";
import { formatCurrency } from "@/lib/format";
import type { Agent } from "@/types/api";

export const Route = createFileRoute("/buyer")({
  head: () => ({
    meta: [
      { title: "Buyer dashboard — Haggl" },
      { name: "description", content: "Manage your AI buyer agent and negotiated orders." },
      { property: "og:title", content: "Buyer dashboard — Haggl" },
      { property: "og:description", content: "Manage your AI buyer agent and negotiated orders." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

function BuyerAgentPanel({ userId }: { userId: string }) {
  const [agentId, setAgentId] = useState(
    () => window.localStorage.getItem(`haggl:buyer-agent:${userId}`) ?? "",
  );
  const [objective, setObjective] = useState("Find the best value for my next purchase");
  const [category, setCategory] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [preferences, setPreferences] = useState("");

  const agent = useQuery({
    queryKey: ["buyer-agent", agentId],
    queryFn: () => getBuyerAgent(agentId),
    enabled: Boolean(agentId),
    retry: false,
  });
  const create = useMutation({
    mutationFn: () =>
      createBuyerAgent({
        objective,
        ...(category ? { category } : {}),
        ...(maxBudget ? { max_budget: Number(maxBudget) } : {}),
        ...(preferences ? { preferences: { notes: preferences } } : {}),
      }),
    onSuccess: (created) => {
      const id = String(created.id);
      setAgentId(id);
      window.localStorage.setItem(`haggl:buyer-agent:${userId}`, id);
      toast.success("Buyer agent created");
    },
    onError: (error: Error) =>
      toast.error("Couldn't create buyer agent", { description: error.message }),
  });
  const recommend = useMutation({
    mutationFn: () =>
      triggerBuyerAgentRecommendation(agentId, {
        category,
        max_budget: Number(maxBudget) || undefined,
      }),
    onSuccess: () => toast.success("Recommendations requested"),
    onError: (error: Error) =>
      toast.error("Couldn't request recommendations", { description: error.message }),
  });

  return (
    <div className="surface space-y-5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground">Buyer agent</h2>
          <p className="text-sm text-muted-foreground">
            Create an agent, inspect it through the API, and request recommendations.
          </p>
        </div>
        {agentId ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => void agent.refetch()}
            disabled={agent.isFetching}
          >
            <RefreshCw className="size-4" /> Refresh
          </Button>
        ) : null}
      </div>
      {!agentId ? (
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            create.mutate();
          }}
        >
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="buyer-objective">Objective</Label>
            <Textarea
              id="buyer-objective"
              value={objective}
              onChange={(event) => setObjective(event.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="buyer-category">Category</Label>
            <Input
              id="buyer-category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="Electronics"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="buyer-budget">Maximum budget</Label>
            <Input
              id="buyer-budget"
              type="number"
              min={0}
              value={maxBudget}
              onChange={(event) => setMaxBudget(event.target.value)}
            />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="buyer-preferences">Preferences</Label>
            <Textarea
              id="buyer-preferences"
              value={preferences}
              onChange={(event) => setPreferences(event.target.value)}
              placeholder="Brand, condition, size or other requirements"
            />
          </div>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}{" "}
            Create buyer agent
          </Button>
        </form>
      ) : agent.isPending ? (
        <Skeleton className="h-20 w-full rounded-xl" />
      ) : agent.isError ? (
        <ErrorState title="Couldn't load your buyer agent" onRetry={() => agent.refetch()} />
      ) : (
        <AgentSummary
          agent={agent.data}
          onRecommend={() => recommend.mutate()}
          isPending={recommend.isPending}
        />
      )}
    </div>
  );
}

function AgentSummary({
  agent,
  onRecommend,
  isPending,
}: {
  agent: Agent;
  onRecommend: () => void;
  isPending: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border p-4 text-sm">
      <div>
        <p className="font-semibold text-foreground">{agent.name ?? "Buyer agent"}</p>
        <p className="mt-1 text-muted-foreground">
          {agent.objective ?? agent.description ?? "Configured buyer agent"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">Agent ID: {agent.id}</p>
      </div>
      <Button onClick={onRecommend} disabled={isPending}>
        <Sparkles className="size-4" /> {isPending ? "Requesting..." : "Get recommendations"}
      </Button>
    </div>
  );
}

function DashboardPage() {
  const { user, isAuthenticated } = useSession();
  const isSeller = isAuthenticated && user?.role === "seller";
  const orders = useQuery({ ...myOrdersQuery(), enabled: isAuthenticated });

  return (
    <PageShell>
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-10 sm:px-6 sm:py-14">
        <SectionHeading
          title="Buyer dashboard"
          description="Manage your AI buyer agent and negotiated orders."
          action={
            isSeller ? (
              <Button asChild size="sm" variant="outline">
                <Link to="/seller">Seller dashboard</Link>
              </Button>
            ) : undefined
          }
        />
        {isAuthenticated && user ? (
          <>
            <div className="surface flex flex-wrap items-center gap-4 p-5">
              <UserAvatar user={user} className="size-12 text-base" />
              <div className="min-w-0">
                <p className="font-display text-lg font-semibold text-foreground">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-sm capitalize text-muted-foreground">{user.role} account</p>
              </div>
              <Button asChild variant="outline" className="ms-auto">
                <Link to="/">Browse listings</Link>
              </Button>
            </div>
            <BuyerAgentPanel userId={user.id} />
          </>
        ) : null}
        {!isAuthenticated ? (
          <EmptyState
            title="Log in to manage your buyer agent"
            action={
              <Button asChild>
                <Link to="/signin">Log in</Link>
              </Button>
            }
          />
        ) : orders.isError ? (
          <ErrorState title="Couldn't load your orders" onRetry={() => orders.refetch()} />
        ) : orders.isPending ? (
          <Skeleton className="h-40 w-full rounded-2xl" />
        ) : orders.data.length === 0 ? (
          <EmptyState
            title="No orders yet"
            description="Start a negotiation and close your first deal."
            action={
              <Button asChild>
                <Link to="/">Browse listings</Link>
              </Button>
            }
          />
        ) : (
          <ul className="grid gap-3">
            {orders.data.map((order) => (
              <li key={order.id} className="surface flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">Order {order.id}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(orderTotal(order), order.currency ?? "USD")} ·{" "}
                    {order.quantity ?? 1} item(s)
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <StatusBadge status={order.status ?? "pending"} />
                  <Button asChild size="sm" variant="outline">
                    <Link to="/orders/$orderId" params={{ orderId: order.id }}>
                      View
                    </Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageShell>
  );
}
