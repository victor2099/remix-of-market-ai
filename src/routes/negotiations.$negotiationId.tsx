import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bot, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/marketplace/page-shell";
import { StatusBadge } from "@/components/marketplace/primitives";
import { ErrorState } from "@/components/marketplace/states";
import {
  CounterOfferForm,
  NegotiationStats,
  OfferTimeline,
  TurnIndicator,
} from "@/components/marketplace/negotiation-room";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  isAccepted,
  isOpen,
  negotiationQuery,
  offerHistory,
  submitOffer,
  triggerSellerAgent,
} from "@/lib/api/negotiations";
import { createOrder } from "@/lib/api/orders";
import { productQuery } from "@/lib/api/products";

export const Route = createFileRoute("/negotiations/$negotiationId")({
  head: () => ({
    meta: [
      { title: "Negotiation workspace — Haggl" },
      {
        name: "description",
        content: "Trade counter-offers with the seller's AI agent and close the deal.",
      },
      { property: "og:title", content: "Negotiation workspace — Haggl" },
      { property: "og:description", content: "Live agent-to-agent price negotiation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NegotiationPage,
});

function NegotiationPage() {
  const { negotiationId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const negotiation = useQuery({
    ...negotiationQuery(negotiationId),
    refetchInterval: (query) => (isOpen(query.state.data) ? 5000 : false),
  });
  const n = negotiation.data;
  const product = useQuery({ ...productQuery(n?.product_id ?? ""), enabled: Boolean(n?.product_id) });
  const currency = n?.currency ?? product.data?.currency ?? "USD";
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["negotiation", negotiationId] });

  const counter = useMutation({
    mutationFn: (input: { amount: number; message: string }) =>
      submitOffer(negotiationId, { amount: input.amount, message: input.message }),
    onSuccess: () => {
      toast.success("Offer sent");
      invalidate();
    },
  });

  const sellerTurn = useMutation({
    mutationFn: () => {
      if (!n?.seller_agent_id) throw new Error("This seller has no autonomous agent configured");
      return triggerSellerAgent(n.seller_agent_id, negotiationId);
    },
    onSuccess: () => invalidate(),
    onError: (error: Error) => toast.error("Agent unavailable", { description: error.message }),
  });

  const order = useMutation({
    mutationFn: () => createOrder(negotiationId),
    onSuccess: (created) => {
      toast.success("Order placed");
      navigate({ to: "/orders/$orderId", params: { orderId: created.id } });
    },
  });

  if (negotiation.isError) {
    return (
      <PageShell>
        <div className="mx-auto max-w-3xl px-4 py-16">
          <ErrorState
            title="This negotiation isn't available"
            description="It may have closed or belongs to another account."
            onRetry={() => negotiation.refetch()}
          />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell footer={false}>
      <div className="mx-auto w-full max-w-7xl px-0 sm:px-6 sm:py-6">
        <div className="border-b border-border bg-card px-4 py-3 sm:rounded-t-2xl sm:border sm:px-5">
          {n ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Button asChild variant="ghost" size="icon" aria-label="Back to marketplace">
                  <Link to="/">
                    <ArrowLeft />
                  </Link>
                </Button>
                <div className="min-w-0">
                  <p className="text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
                    Negotiating
                  </p>
                  <p className="truncate text-sm font-semibold text-foreground">
                    {product.data?.name ?? `Product ${n.product_id}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TurnIndicator turn={n.current_turn} />
                <StatusBadge status={n.status} />
              </div>
            </div>
          ) : (
            <Skeleton className="h-12 w-full" />
          )}
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-6">
          <div className="flex min-h-[60vh] flex-col border-border bg-background sm:rounded-b-2xl sm:border sm:border-t-0 lg:min-h-[70vh]">
            {negotiation.isPending || !n ? (
              <div className="space-y-4 p-5">
                <Skeleton className="h-24 w-2/3 rounded-2xl" />
                <Skeleton className="ml-auto h-24 w-2/3 rounded-2xl" />
              </div>
            ) : (
              <>
                <OfferTimeline
                  offers={offerHistory(n)}
                  currency={currency}
                  askingPrice={product.data?.price ?? null}
                />
                {isAccepted(n) ? (
                  <div className="border-t border-border bg-card p-4">
                    <Button
                      className="w-full"
                      onClick={() => order.mutate()}
                      disabled={order.isPending}
                    >
                      {order.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                      Place order at the agreed price
                    </Button>
                  </div>
                ) : isOpen(n) ? (
                  <>
                    {n.current_turn === "seller" ? (
                      <div className="border-t border-border bg-card p-4">
                        <Button
                          variant="ai"
                          className="w-full"
                          onClick={() => sellerTurn.mutate()}
                          disabled={sellerTurn.isPending}
                        >
                          {sellerTurn.isPending ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Bot className="size-4" />
                          )}
                          Ask the seller agent to respond
                        </Button>
                      </div>
                    ) : null}
                    <CounterOfferForm
                      currency={currency}
                      maxPrice={n.max_price ?? null}
                      disabled={n.current_turn === "seller"}
                      pending={counter.isPending}
                      onSubmit={(amount, message) => counter.mutate({ amount, message })}
                    />
                  </>
                ) : (
                  <div className="border-t border-border bg-card p-4 text-sm text-muted-foreground">
                    This negotiation is closed.
                  </div>
                )}
              </>
            )}
          </div>

          <aside className="p-4 sm:p-0 lg:block">
            {n ? (
              <div className="lg:sticky lg:top-24">
                <NegotiationStats
                  negotiation={n}
                  currency={currency}
                  askingPrice={product.data?.price ?? null}
                />
              </div>
            ) : (
              <Skeleton className="h-80 w-full rounded-2xl" />
            )}
          </aside>
        </div>
      </div>
    </PageShell>
  );
}
