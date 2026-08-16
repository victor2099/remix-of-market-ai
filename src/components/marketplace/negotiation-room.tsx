import { Bot, Sparkles, User2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatAmountInput, formatCurrency, parseAmountInput } from "@/lib/format";
import { offerAmount, offerSide } from "@/lib/api/negotiations";
import { cn } from "@/lib/utils";
import type { Negotiation, NegotiationOffer, NegotiationTurn } from "@/types/api";
import { Price, StatusBadge } from "./primitives";

export function TurnIndicator({ turn }: { turn: NegotiationTurn | undefined }) {
  if (!turn) return null;
  const isBuyer = turn === "buyer";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        isBuyer ? "border-brand/30 bg-brand-soft text-brand" : "border-ai/25 bg-ai-soft text-ai",
      )}
    >
      {isBuyer ? <User2 className="size-3" /> : <Bot className="size-3" />}
      {isBuyer ? "Your turn" : "Seller agent's turn"}
    </span>
  );
}

export function OfferTimeline({
  offers,
  currency,
  askingPrice,
}: {
  offers: NegotiationOffer[];
  currency: string;
  askingPrice: number | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" });
  }, [offers.length]);

  if (offers.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-muted-foreground">
        No offers traded yet. Send the first counter-offer to get things moving.
      </div>
    );
  }

  return (
    <div ref={ref} className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
      {offers.map((offer, index) => {
        const side = offerSide(offer);
        const isBuyer = side === "buyer";
        const amount = offerAmount(offer);
        const savings = askingPrice ? Math.max(askingPrice - amount, 0) : 0;
        return (
          <div
            key={offer.id ?? `${side}-${index}`}
            className={cn(
              "animate-msg-in flex w-full flex-col gap-1.5",
              isBuyer ? "items-end" : "items-start",
            )}
          >
            <span className="px-1 text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
              {isBuyer ? "You" : "Seller agent"}
              {offer.round ? ` · round ${offer.round}` : ""}
            </span>
            <div className="surface w-full max-w-sm p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
                  {isBuyer ? "Buyer offer" : "Seller response"}
                </span>
                {offer.action ? <StatusBadge status={String(offer.action).toLowerCase()} /> : null}
              </div>
              <Price amount={amount} currency={currency} size="lg" className="mt-2 block" />
              {askingPrice ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  {formatCurrency(savings, currency)} below the asking price
                </p>
              ) : null}
              {offer.message || offer.reasoning ? (
                <p className="mt-3 border-t border-border pt-3 text-sm leading-relaxed text-foreground">
                  {offer.message ?? offer.reasoning}
                </p>
              ) : null}
            </div>
            {offer.created_at ? (
              <span className="px-1 text-[0.7rem] text-muted-foreground">
                {new Date(offer.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function CounterOfferForm({
  currency,
  maxPrice,
  disabled,
  pending,
  onSubmit,
}: {
  currency: string;
  maxPrice: number | null;
  disabled: boolean;
  pending: boolean;
  onSubmit: (amount: number, message: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const [message, setMessage] = useState("");
  const amount = parseAmountInput(draft);
  const invalid = amount <= 0;

  return (
    <form
      className="space-y-3 border-t border-border bg-card p-3 sm:p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (invalid || disabled) return;
        onSubmit(amount, message.trim());
        setDraft("");
        setMessage("");
      }}
    >
      <div>
        <label className="text-xs font-medium text-muted-foreground" htmlFor="counter-amount">
          Your counter-offer
        </label>
        <Input
          id="counter-amount"
          inputMode="numeric"
          value={draft}
          onChange={(e) => setDraft(formatAmountInput(e.target.value))}
          placeholder="1,250"
          className="mt-1.5 h-11 rounded-xl"
          disabled={disabled}
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          {maxPrice
            ? `Your walk-away limit is ${formatCurrency(maxPrice, currency)}`
            : "Enter the amount you want to offer."}
        </p>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground" htmlFor="counter-message">
          Note to the seller agent (optional)
        </label>
        <Textarea
          id="counter-message"
          rows={2}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="I can pay today if you can meet this price."
          className="mt-1.5 resize-none rounded-xl"
          disabled={disabled}
        />
      </div>
      <Button
        type="submit"
        variant="negotiate"
        className="w-full"
        disabled={disabled || invalid || pending}
      >
        {pending ? "Sending…" : "Submit counter-offer"}
      </Button>
    </form>
  );
}

export function NegotiationStats({
  negotiation,
  currency,
  askingPrice,
}: {
  negotiation: Negotiation;
  currency: string;
  askingPrice: number | null;
}) {
  const rows: [string, string][] = [
    ["Asking price", askingPrice ? formatCurrency(askingPrice, currency) : "—"],
    ["Opening offer", negotiation.initial_offer ? formatCurrency(negotiation.initial_offer, currency) : "—"],
    [
      "Latest offer",
      negotiation.current_offer ? formatCurrency(negotiation.current_offer, currency) : "—",
    ],
    ["Your max price", negotiation.max_price ? formatCurrency(negotiation.max_price, currency) : "—"],
    ["Quantity", String(negotiation.quantity ?? 1)],
  ];
  if (negotiation.final_price)
    rows.push(["Agreed price", formatCurrency(negotiation.final_price, currency)]);

  return (
    <div className="surface p-5">
      <h2 className="flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        <Sparkles className="size-3.5 text-ai" /> Negotiation summary
      </h2>
      <dl className="mt-4 space-y-3 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="text-right font-medium text-foreground">{value}</dd>
          </div>
        ))}
        <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
          <dt className="text-muted-foreground">Status</dt>
          <dd>
            <StatusBadge status={negotiation.status} />
          </dd>
        </div>
      </dl>
    </div>
  );
}