import { Check, Sparkles, Star } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";

export function Price({
  amount,
  currency = "USD",
  size = "md",
  className,
  strike,
}: {
  amount: number;
  currency?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string | undefined;
  strike?: boolean | undefined;
}) {
  const sizes = {
    sm: "text-sm font-semibold",
    md: "text-base font-semibold",
    lg: "text-2xl font-bold tracking-tight",
    xl: "text-3xl sm:text-4xl font-bold tracking-tight",
  } as const;
  return (
    <span
      className={cn(
        sizes[size],
        strike ? "text-muted-foreground line-through" : "text-foreground",
        className,
      )}
    >
      {formatCurrency(amount, currency)}
    </span>
  );
}

export function Rating({
  value,
  count,
  className,
  compact,
}: {
  value: number;
  count?: number | undefined;
  className?: string | undefined;
  compact?: boolean | undefined;
}) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="flex items-center" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn(
              "size-3.5",
              i <= Math.round(value) ? "fill-warning text-warning" : "text-border",
            )}
          />
        ))}
      </div>
      <span className="text-xs font-medium text-foreground">{value.toFixed(1)}</span>
      {count !== undefined && !compact ? (
        <span className="text-xs text-muted-foreground">({count} reviews)</span>
      ) : null}
      <span className="sr-only">
        Rated {value.toFixed(1)} out of 5{count !== undefined ? ` from ${count} reviews` : ""}
      </span>
    </div>
  );
}

export function SellerBadge({
  seller,
  className,
  showRating,
}: {
  seller: { name: string; verified?: boolean | undefined; rating?: number | null | undefined };
  className?: string | undefined;
  showRating?: boolean | undefined;
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2", className)}>
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-[0.65rem] font-bold text-primary-foreground">
        {seller.name.slice(0, 2).toUpperCase()}
      </span>
      <span className="truncate text-sm font-medium text-foreground">{seller.name}</span>
      {seller.verified ? (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-[0.7rem] font-medium text-success">
          <Check className="size-3" /> Verified
        </span>
      ) : (
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[0.7rem] font-medium text-muted-foreground">
          Unverified
        </span>
      )}
      {showRating && typeof seller.rating === "number" ? (
        <span className="shrink-0 text-xs text-muted-foreground">{seller.rating.toFixed(1)} ★</span>
      ) : null}
    </div>
  );
}

const statusTone: Record<string, string> = {
  pending: "bg-warning-soft text-warning-foreground border-warning/30",
  active: "bg-warning-soft text-warning-foreground border-warning/30",
  in_progress: "bg-warning-soft text-warning-foreground border-warning/30",
  negotiating: "bg-warning-soft text-warning-foreground border-warning/30",
  accepted: "bg-success-soft text-success border-success/30",
  completed: "bg-success-soft text-success border-success/30",
  paid: "bg-success-soft text-success border-success/30",
  shipped: "bg-brand-soft text-brand border-brand/30",
  countered: "bg-brand-soft text-brand border-brand/30",
  rejected: "bg-destructive-soft text-destructive border-destructive/30",
  cancelled: "bg-destructive-soft text-destructive border-destructive/30",
  expired: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({
  status,
  className,
  withDot = true,
}: {
  status: string;
  className?: string | undefined;
  withDot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize transition-colors",
        statusTone[status] ?? "bg-muted text-muted-foreground border-border",
        className,
      )}
    >
      {withDot ? <span className="size-1.5 rounded-full bg-current" /> : null}
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function NegotiableBadge({ className }: { className?: string | undefined }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-warning/30 bg-warning-soft px-2 py-0.5 text-[0.7rem] font-medium text-warning-foreground",
        className,
      )}
    >
      Negotiable
    </span>
  );
}

export function AiTag({
  className,
  label = "AI Assistant",
}: {
  className?: string | undefined;
  label?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-ai/25 bg-ai-soft px-2 py-0.5 text-[0.7rem] font-semibold text-ai",
        className,
      )}
    >
      <Sparkles className="size-3" /> {label}
    </span>
  );
}

export function SectionHeading({
  title,
  action,
  description,
}: {
  title: string;
  description?: string | undefined;
  action?: ReactNode | undefined;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 sm:flex sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}