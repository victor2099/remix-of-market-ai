import { ArrowRight, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatAmountInput, formatCurrency, parseAmountInput } from "@/lib/format";
import type { NegotiationMessage, Offer, Product } from "@/types/marketplace";
import { AiTag, Price, StatusBadge } from "./primitives";

export function OfferCard({
  offer,
  currency,
  onAccept,
  onCounter,
}: {
  offer: Offer;
  currency: string;
  onAccept?: () => void;
  onCounter?: () => void;
}) {
  const savings = Math.max(offer.originalPrice - offer.amount, 0);
  const actionable = offer.status === "pending" && offer.by === "seller";
  return (
    <div className="surface w-full max-w-sm p-4 transition-shadow duration-200">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
          {offer.by === "buyer" ? "Your offer" : "Seller offer"}
        </span>
        <StatusBadge status={offer.status} />
      </div>
      <Price amount={offer.amount} currency={currency} size="lg" className="mt-2 block" />
      <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3 text-xs">
        <div>
          <dt className="text-muted-foreground">Original price</dt>
          <dd className="mt-0.5 font-medium text-foreground">
            {formatCurrency(offer.originalPrice, currency)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Savings</dt>
          <dd className="mt-0.5 font-medium text-success">{formatCurrency(savings, currency)}</dd>
        </div>
      </dl>
      {actionable ? (
        <div className="mt-4 flex gap-2">
          <Button size="sm" variant="success" className="flex-1" onClick={onAccept}>
            Accept
          </Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={onCounter}>
            Counter
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function AiSuggestion({
  amount,
  currency,
  onUse,
  onAnother,
}: {
  amount: number;
  currency: string;
  onUse: () => void;
  onAnother: () => void;
}) {
  return (
    <div className="mt-3 rounded-xl border border-ai/25 bg-card p-3">
      <p className="text-sm font-semibold text-foreground">{formatCurrency(amount, currency)}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">Suggested next offer</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="ai" onClick={onUse}>
          <Sparkles /> Use suggestion
        </Button>
        <Button size="sm" variant="ghost" onClick={onAnother}>
          Make another offer
        </Button>
      </div>
    </div>
  );
}

export function MessageBubble({
  message,
  currency,
  onUseSuggestion,
  onAnotherOffer,
  onAcceptOffer,
  onCounterOffer,
}: {
  message: NegotiationMessage;
  currency: string;
  onUseSuggestion: (amount: number, text: string) => void;
  onAnotherOffer: () => void;
  onAcceptOffer: (offer: Offer) => void;
  onCounterOffer: (offer: Offer) => void;
}) {
  const isBuyer = message.author === "buyer";
  const isAi = message.author === "ai";

  return (
    <div
      className={cn(
        "animate-msg-in flex w-full flex-col gap-1.5",
        isBuyer ? "items-end" : "items-start",
      )}
    >
      <span className="px-1 text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
        {isAi ? null : isBuyer ? "You" : "Seller"}
      </span>
      {message.offer ? (
        <OfferCard
          offer={message.offer}
          currency={currency}
          onAccept={() => onAcceptOffer(message.offer!)}
          onCounter={() => onCounterOffer(message.offer!)}
        />
      ) : (
        <div
          className={cn(
            "max-w-[85%] rounded-2xl border px-3.5 py-2.5 text-sm leading-relaxed sm:max-w-[75%]",
            isAi
              ? "border-ai/20 bg-ai-soft text-foreground"
              : isBuyer
                ? "border-transparent bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground",
          )}
        >
          {isAi ? <AiTag className="mb-2" /> : null}
          <p>{message.body}</p>
          {isAi && message.suggestion ? (
            <AiSuggestion
              amount={message.suggestion.amount}
              currency={currency}
              onUse={() =>
                onUseSuggestion(
                  message.suggestion!.amount,
                  message.suggestion!.message.replace(
                    "{amount}",
                    formatCurrency(message.suggestion!.amount, currency),
                  ),
                )
              }
              onAnother={onAnotherOffer}
            />
          ) : null}
        </div>
      )}
      <span className="px-1 text-[0.7rem] text-muted-foreground">{message.createdAt}</span>
    </div>
  );
}

export function MessageComposer({
  currency,
  originalPrice,
  mode,
  onModeChange,
  offerDraft,
  onOfferDraftChange,
  onSendMessage,
  onSendOffer,
  disabled,
}: {
  currency: string;
  originalPrice: number;
  mode: "message" | "offer";
  onModeChange: (mode: "message" | "offer") => void;
  offerDraft: string;
  onOfferDraftChange: (value: string) => void;
  onSendMessage: (text: string) => void;
  onSendOffer: (amount: number) => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");
  const amount = parseAmountInput(offerDraft);
  const offerInvalid = mode === "offer" && (amount <= 0 || amount > originalPrice);

  return (
    <div className="border-t border-border bg-card p-3 sm:p-4">
      <div
        role="tablist"
        aria-label="Composer mode"
        className="mb-3 inline-flex rounded-lg bg-muted p-1"
      >
        {(["message", "offer"] as const).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => onModeChange(m)}
            className={cn(
              "cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors",
              mode === m
                ? "bg-card text-foreground shadow-soft"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {m === "message" ? "Message" : "Price offer"}
          </button>
        ))}
      </div>

      {mode === "message" ? (
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            onSendMessage(text.trim());
            setText("");
          }}
        >
          <label className="sr-only" htmlFor="composer-message">
            Message
          </label>
          <Textarea
            id="composer-message"
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (!text.trim()) return;
                onSendMessage(text.trim());
                setText("");
              }
            }}
            placeholder="Type your message or offer…"
            className="min-h-11 resize-none rounded-xl"
          />
          <Button type="submit" disabled={disabled || !text.trim()}>
            Send <ArrowRight />
          </Button>
        </form>
      ) : (
        <form
          className="flex flex-col gap-2 sm:flex-row sm:items-start"
          onSubmit={(e) => {
            e.preventDefault();
            if (offerInvalid) return;
            onSendOffer(amount);
          }}
        >
          <div className="w-full">
            <label className="sr-only" htmlFor="composer-offer">
              Offer amount
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                ₦
              </span>
              <Input
                id="composer-offer"
                inputMode="numeric"
                value={offerDraft}
                aria-invalid={offerInvalid}
                aria-describedby="offer-help"
                onChange={(e) => onOfferDraftChange(formatAmountInput(e.target.value))}
                placeholder="1,150,000"
                className="h-11 rounded-xl pl-7"
              />
            </div>
            <p
              id="offer-help"
              className={cn("mt-1.5 text-xs", offerInvalid ? "text-destructive" : "text-muted-foreground")}
            >
              {offerInvalid
                ? `Enter an amount between ₦1 and ${formatCurrency(originalPrice, currency)}`
                : `Original price ${formatCurrency(originalPrice, currency)}`}
            </p>
          </div>
          <Button
            type="submit"
            variant="negotiate"
            className="h-11 shrink-0"
            disabled={disabled || offerInvalid || !offerDraft}
          >
            Make offer
          </Button>
        </form>
      )}
    </div>
  );
}

export function NegotiationSummary({
  product,
  currentOffer,
  status,
  onAccept,
  onCounter,
}: {
  product: Product;
  currentOffer: number | null;
  status: "negotiating" | "accepted" | "rejected" | "expired";
  onAccept: () => void;
  onCounter: () => void;
}) {
  const savings = currentOffer ? Math.max(product.price - currentOffer, 0) : 0;
  return (
    <div className="surface p-5">
      <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        Negotiation summary
      </h2>
      <div className="mt-4 flex min-w-0 items-center gap-3">
        <img
          src={product.image}
          alt=""
          loading="lazy"
          width={96}
          height={96}
          className="size-14 shrink-0 rounded-xl border border-border object-cover"
        />
        <p className="min-w-0 text-sm font-medium leading-snug text-foreground">{product.name}</p>
      </div>
      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">Original price</dt>
          <dd className="font-medium text-foreground">
            {formatCurrency(product.price, product.currency)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">Current offer</dt>
          <dd className="font-semibold text-foreground">
            {currentOffer ? formatCurrency(currentOffer, product.currency) : "—"}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">Potential savings</dt>
          <dd className="font-semibold text-success">
            {formatCurrency(savings, product.currency)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
          <dt className="text-muted-foreground">Seller</dt>
          <dd className="truncate font-medium text-foreground">
            {product.seller.name}
            {product.seller.verified ? " ✓" : ""}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">Status</dt>
          <dd>
            <StatusBadge status={status} />
          </dd>
        </div>
      </dl>
      <div className="mt-5 grid gap-2">
        <Button variant="success" onClick={onAccept} disabled={!currentOffer || status !== "negotiating"}>
          Accept offer
        </Button>
        <Button variant="outline" onClick={onCounter} disabled={status !== "negotiating"}>
          Counter offer
        </Button>
      </div>
    </div>
  );
}

/** Keeps the conversation scrolled to the newest message. */
export function useScrollToLatest(dep: unknown) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" });
  }, [dep]);
  return ref;
}