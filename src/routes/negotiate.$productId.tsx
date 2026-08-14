import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/marketplace/site-header";
import {
  MessageBubble,
  MessageComposer,
  NegotiationSummary,
  useScrollToLatest,
} from "@/components/marketplace/negotiation";
import { Price, StatusBadge } from "@/components/marketplace/primitives";
import { ErrorState } from "@/components/marketplace/states";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { formatAmountInput, formatCurrency } from "@/lib/format";
import { negotiationQuery, productQuery } from "@/lib/api/marketplace";
import type { NegotiationMessage, NegotiationStatus, Offer } from "@/types/marketplace";

export const Route = createFileRoute("/negotiate/$productId")({
  head: () => ({
    meta: [
      { title: "Negotiate this price — Haggl" },
      {
        name: "description",
        content:
          "Chat with the seller, send structured offers and get AI suggestions on what to offer next.",
      },
      { property: "og:title", content: "Negotiate this price — Haggl" },
      {
        property: "og:description",
        content: "A negotiation workspace with offer tracking and an AI assistant.",
      },
    ],
  }),
  component: NegotiatePage,
});

function timeNow() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function NegotiatePage() {
  const { productId } = Route.useParams();
  const product = useQuery(productQuery(productId));
  const negotiation = useQuery(negotiationQuery(productId));

  const [messages, setMessages] = useState<NegotiationMessage[]>([]);
  const [status, setStatus] = useState<NegotiationStatus>("negotiating");
  const [currentOffer, setCurrentOffer] = useState<number | null>(null);
  const [mode, setMode] = useState<"message" | "offer">("message");
  const [offerDraft, setOfferDraft] = useState("");
  const scrollRef = useScrollToLatest(messages.length);

  useEffect(() => {
    if (negotiation.data) {
      setMessages(negotiation.data.messages);
      setStatus(negotiation.data.status);
      setCurrentOffer(negotiation.data.currentOffer);
    }
  }, [negotiation.data]);

  const p = product.data;

  const push = (message: Omit<NegotiationMessage, "id" | "createdAt">) =>
    setMessages((prev) => [
      ...prev,
      { ...message, id: `m_${prev.length + 1}_${Date.now()}`, createdAt: timeNow() },
    ]);

  const sendMessage = (text: string) => push({ author: "buyer", body: text });

  const sendOffer = (amount: number) => {
    if (!p) return;
    const offer: Offer = {
      id: `o_${Date.now()}`,
      amount,
      originalPrice: p.price,
      status: "pending",
      by: "buyer",
    };
    push({ author: "buyer", offer });
    setCurrentOffer(amount);
    setOfferDraft("");
    setMode("message");
    toast.success("Offer sent", { description: formatCurrency(amount, p.currency) });

    const counter = Math.round(((amount + p.price * 0.96) / 2 / 1000) * 1000);
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) =>
          m.offer && m.offer.id === offer.id ? { ...m, offer: { ...m.offer, status: "countered" } } : m,
        ),
      );
      push({
        author: "seller",
        body: "Thanks for the offer. I can meet you part of the way on this one.",
      });
      push({
        author: "seller",
        offer: {
          id: `o_${Date.now()}_s`,
          amount: counter,
          originalPrice: p.price,
          status: "pending",
          by: "seller",
        },
      });
      setCurrentOffer(counter);
    }, 1200);
  };

  const acceptOffer = (offer?: Offer) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.offer && (!offer || m.offer.id === offer.id) && m.offer.status === "pending"
          ? { ...m, offer: { ...m.offer, status: "accepted" } }
          : m,
      ),
    );
    setStatus("accepted");
    if (offer) setCurrentOffer(offer.amount);
    toast.success("Offer accepted", { description: "Continue to checkout to complete the order." });
  };

  const counterOffer = (offer?: Offer) => {
    setMode("offer");
    if (offer) setOfferDraft(formatAmountInput(String(Math.round(offer.amount * 0.97))));
    document.getElementById("composer-offer")?.focus();
  };

  if (negotiation.isError || product.isError) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-3xl px-4 py-16">
          <ErrorState
            title="This negotiation isn't available"
            description="The listing may have been removed or the negotiation has closed."
            onRetry={() => {
              product.refetch();
              negotiation.refetch();
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <div className="mx-auto w-full max-w-7xl flex-1 px-0 sm:px-6 sm:py-6">
        <div className="border-b border-border bg-card px-4 py-3 sm:rounded-t-2xl sm:border sm:px-5">
          {p ? (
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Button asChild variant="ghost" size="icon" className="shrink-0" aria-label="Back to product">
                  <Link to="/product/$productId" params={{ productId: p.id }}>
                    <ArrowLeft />
                  </Link>
                </Button>
                <img
                  src={p.image}
                  alt=""
                  loading="lazy"
                  width={96}
                  height={96}
                  className="size-11 shrink-0 rounded-xl border border-border object-cover"
                />
                <div className="min-w-0">
                  <p className="text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
                    Negotiating
                  </p>
                  <p className="truncate text-sm font-semibold text-foreground">{p.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {p.seller.name}
                    {p.seller.verified ? " ✓" : ""} · <Price amount={p.price} currency={p.currency} size="sm" />
                  </p>
                </div>
              </div>
              <div className="hidden sm:block">
                <StatusBadge status={status} />
              </div>
            </div>
          ) : (
            <Skeleton className="h-12 w-full" />
          )}
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6">
          <div className="flex min-h-[60vh] flex-col border-border bg-background sm:min-h-[64vh] sm:rounded-b-2xl sm:border sm:border-t-0 lg:min-h-[70vh]">
            <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
              {negotiation.isPending ? (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-2/3 rounded-2xl" />
                  <Skeleton className="ml-auto h-16 w-1/2 rounded-2xl" />
                  <Skeleton className="h-28 w-3/4 rounded-2xl" />
                </div>
              ) : (
                messages.map((m) => (
                  <MessageBubble
                    key={m.id}
                    message={m}
                    currency={p?.currency ?? "NGN"}
                    onUseSuggestion={(amount, text) => {
                      setMode("offer");
                      setOfferDraft(formatAmountInput(String(amount)));
                      toast.info("Suggestion applied", { description: text });
                    }}
                    onAnotherOffer={() => counterOffer()}
                    onAcceptOffer={(offer) => acceptOffer(offer)}
                    onCounterOffer={(offer) => counterOffer(offer)}
                  />
                ))
              )}
            </div>

            {p ? (
              <MessageComposer
                currency={p.currency}
                originalPrice={p.price}
                mode={mode}
                onModeChange={setMode}
                offerDraft={offerDraft}
                onOfferDraftChange={setOfferDraft}
                onSendMessage={sendMessage}
                onSendOffer={sendOffer}
                disabled={status !== "negotiating"}
              />
            ) : null}
          </div>

          <aside className="hidden lg:block">
            {p ? (
              <div className="sticky top-24">
                <NegotiationSummary
                  product={p}
                  currentOffer={currentOffer}
                  status={status}
                  onAccept={() => acceptOffer()}
                  onCounter={() => counterOffer()}
                />
              </div>
            ) : (
              <Skeleton className="h-80 w-full rounded-2xl" />
            )}
          </aside>
        </div>
      </div>

      {p ? (
        <div className="sticky bottom-0 z-30 border-t border-border bg-card/95 p-3 backdrop-blur lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  Negotiation summary
                  <StatusBadge status={status} withDot={false} />
                </span>
                <ChevronUp />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
              <SheetHeader>
                <SheetTitle className="sr-only">Negotiation summary</SheetTitle>
              </SheetHeader>
              <div className="mt-2">
                <NegotiationSummary
                  product={p}
                  currentOffer={currentOffer}
                  status={status}
                  onAccept={() => acceptOffer()}
                  onCounter={() => counterOffer()}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      ) : null}
    </div>
  );
}
