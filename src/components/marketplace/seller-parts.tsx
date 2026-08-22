import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ReactNode } from "react";
import { StatusBadge } from "@/components/marketplace/primitives";
import { EmptyState, ErrorState } from "@/components/marketplace/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createMySellerProfile,
  negotiationConfigQuery,
  sellerProfileQuery,
  updateMySellerProfile,
  updateNegotiationConfig,
} from "@/lib/api/sellers";
import { myOrdersQuery, orderTotal } from "@/lib/api/orders";
import { formatCurrency } from "@/lib/format";
import type { NegotiationConfig, SellerProfile } from "@/types/api";

export function Panel({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="surface space-y-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-base font-semibold text-foreground">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function num(value: FormDataEntryValue | null): number | undefined {
  const n = Number(value);
  return value === null || value === "" || Number.isNaN(n) ? undefined : n;
}

/** Resolves the signed-in seller's id from GET /sellers/me. */
export function useSellerProfile() {
  const profile = useQuery({ ...sellerProfileQuery() });
  const sellerId = profile.data?.id ?? profile.data?.user_id ?? null;
  return { profile, sellerId };
}

export function ProfileForm({
  profile,
  onSaveSuccess,
}: {
  profile: SellerProfile | undefined;
  onSaveSuccess?: () => void;
}) {
  const qc = useQueryClient();
  const save = useMutation({
    mutationFn: (input: Record<string, unknown>) =>
      profile ? updateMySellerProfile(input) : createMySellerProfile(input),
    onSuccess: (saved) => {
      toast.success(profile ? "Store profile updated" : "Store profile created");
      qc.setQueryData(["seller-profile"], saved);
      void qc.invalidateQueries({ queryKey: ["seller-profile"] });
      onSaveSuccess?.();
    },
    onError: (error: Error) => toast.error("Couldn't save profile", { description: error.message }),
  });

  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const text = (key: string) => String(data.get(key) ?? "").trim();
        // The API rejects empty strings (e.g. contact_email must be a valid address),
        // so only send fields the seller actually filled in.
        const input: Record<string, unknown> = {};
        for (const key of ["business_name", "contact_email", "phone", "description"]) {
          const value = text(key);
          if (value) input[key] = value;
        }
        if (!profile && !input["contact_email"]) {
          toast.error("Contact email is required to create your store profile");
          return;
        }
        save.mutate(input);
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="business_name">Store name</Label>
        <Input
          id="business_name"
          name="business_name"
          required
          defaultValue={profile?.business_name ?? profile?.store_name ?? ""}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="contact_email">Contact email</Label>
        <Input
          id="contact_email"
          name="contact_email"
          type="email"
          defaultValue={profile?.contact_email ?? ""}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" defaultValue={profile?.phone ?? ""} />
      </div>
      <div className="grid gap-2 sm:col-span-2">
        <Label htmlFor="description">About your store</Label>
        <Textarea id="description" name="description" defaultValue={profile?.description ?? ""} />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={save.isPending}>
          {profile ? "Update profile" : "Create store profile"}
        </Button>
      </div>
    </form>
  );
}

export function NegotiationConfigForm() {
  const qc = useQueryClient();
  const config = useQuery({ ...negotiationConfigQuery() });
  const save = useMutation({
    mutationFn: (input: NegotiationConfig) => updateNegotiationConfig(input),
    onSuccess: () => {
      toast.success("Negotiation rules saved");
      void qc.invalidateQueries({ queryKey: ["negotiation-config"] });
    },
    onError: (error: Error) => toast.error("Couldn't save rules", { description: error.message }),
  });
  const current = config.data;

  return (
    <form
      className="grid gap-4 sm:grid-cols-3"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        save.mutate({
          min_acceptable_price: num(data.get("min_acceptable_price")) ?? null,
          auto_accept_threshold: num(data.get("auto_accept_threshold")) ?? null,
          max_discount_percent: num(data.get("max_discount_percent")) ?? null,
          max_rounds: num(data.get("max_rounds")) ?? null,
        });
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="min_acceptable_price">Price floor</Label>
        <Input
          id="min_acceptable_price"
          name="min_acceptable_price"
          type="number"
          min={0}
          step="0.01"
          defaultValue={current?.min_acceptable_price ?? current?.min_price ?? ""}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="auto_accept_threshold">Auto-accept at</Label>
        <Input
          id="auto_accept_threshold"
          name="auto_accept_threshold"
          type="number"
          min={0}
          step="0.01"
          defaultValue={current?.auto_accept_threshold ?? ""}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="max_discount_percent">Max discount %</Label>
        <Input
          id="max_discount_percent"
          name="max_discount_percent"
          type="number"
          min={0}
          max={100}
          defaultValue={current?.max_discount_percent ?? ""}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="max_rounds">Max rounds</Label>
        <Input
          id="max_rounds"
          name="max_rounds"
          type="number"
          min={1}
          defaultValue={current?.max_rounds ?? ""}
        />
      </div>
      <div className="sm:col-span-3">
        <Button type="submit" variant="outline" disabled={save.isPending}>
          Save negotiation rules
        </Button>
      </div>
    </form>
  );
}

export function SellerOrders() {
  const orders = useQuery({ ...myOrdersQuery() });
  if (orders.isPending) return <Skeleton className="h-20 w-full rounded-2xl" />;
  if (orders.isError)
    return <ErrorState title="Couldn't load orders" onRetry={() => orders.refetch()} />;
  if (orders.data.length === 0) return <EmptyState title="No orders yet" />;

  return (
    <ul className="grid gap-3">
      {orders.data.slice(0, 5).map((order) => (
        <li
          key={order.id}
          className="flex items-center justify-between gap-3 rounded-xl border border-border p-4"
        >
          <div className="min-w-0 text-sm">
            <p className="truncate font-semibold text-foreground">Order {order.id}</p>
            <p className="text-muted-foreground">
              {formatCurrency(orderTotal(order), order.currency ?? "USD")}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <StatusBadge status={order.status ?? "pending"} />
            <Button asChild size="sm" variant="outline">
              <Link to="/orders/$orderId" params={{ orderId: order.id }}>
                Manage
              </Link>
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Shared gate for every seller-only page. */
export function SellerGate({
  isAuthenticated,
  isSeller,
  children,
}: {
  isAuthenticated: boolean;
  isSeller: boolean;
  children: ReactNode;
}) {
  if (!isAuthenticated)
    return (
      <EmptyState
        title="Log in to your seller account"
        description="Your store profile, listings and negotiation rules live here."
        action={
          <Button asChild>
            <Link to="/signin">Log in</Link>
          </Button>
        }
      />
    );
  if (!isSeller)
    return (
      <EmptyState
        title="This workspace is for sellers"
        description="Your account is a buyer account — head to your buyer dashboard instead."
        action={
          <Button asChild>
            <Link to="/dashboard">Go to buyer dashboard</Link>
          </Button>
        }
      />
    );
  return <>{children}</>;
}
