import { createFileRoute, Link } from "@tanstack/react-router";
import { Boxes, Bot, PackagePlus } from "lucide-react";
import { PageShell } from "@/components/marketplace/page-shell";
import { SectionHeading } from "@/components/marketplace/primitives";
import { UserAvatar } from "@/components/marketplace/user-avatar";
import {
  NegotiationConfigForm,
  Panel,
  ProfileForm,
  SellerGate,
  SellerOrders,
  useSellerProfile,
} from "@/components/marketplace/seller-parts";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/seller/")({
  head: () => ({
    meta: [
      { title: "Seller dashboard — Haggl" },
      {
        name: "description",
        content:
          "Update your store profile and jump into listings, inventory and negotiation agents from one seller dashboard.",
      },
      { property: "og:title", content: "Seller dashboard — Haggl" },
      {
        property: "og:description",
        content: "Store profile, listings, inventory and AI negotiation agents for Haggl sellers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SellerDashboardPage,
});

const actions = [
  {
    to: "/seller/products",
    label: "Create a product",
    body: "Publish, edit and deactivate your listings.",
    icon: PackagePlus,
  },
  {
    to: "/seller/inventory",
    label: "Create an inventory",
    body: "Track, restock, reserve and release stock.",
    icon: Boxes,
  },
  {
    to: "/seller/agents",
    label: "Create a seller agent",
    body: "Let an AI agent sell an inventory at your price.",
    icon: Bot,
  },
] as const;

function SellerDashboard() {
  const { user } = useSession();
  const { profile } = useSellerProfile();

  return (
    <div className="space-y-6">
      <div className="surface flex flex-wrap items-center gap-4 p-5">
        <UserAvatar user={user} className="size-12 text-base" />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-xl font-bold tracking-tight text-foreground">
            {profile.data?.business_name ?? profile.data?.store_name ?? "Your store"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {user ? `${user.first_name} ${user.last_name} · seller` : "Seller"}
            {profile.data?.is_verified ? " · verified" : ""}
          </p>
        </div>
      </div>

      {profile.isPending ? (
        <Skeleton className="h-48 w-full rounded-2xl" />
      ) : (
        <Panel
          title={profile.data ? "Update your seller profile" : "Set up your store"}
          description={
            profile.data
              ? "Keep your store details current — buyers see this on every listing."
              : "Create your seller profile to start listing products."
          }
        >
          <ProfileForm profile={profile.data} />
        </Panel>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        {actions.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className="surface group flex flex-col gap-3 p-5 transition-colors hover:border-brand/40"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand">
              <action.icon className="size-5" />
            </span>
            <span className="font-display text-sm font-semibold text-foreground">
              {action.label}
            </span>
            <span className="text-sm leading-relaxed text-muted-foreground">{action.body}</span>
          </Link>
        ))}
      </div>

      <Panel
        title="Negotiation rules"
        description="Your price floor and auto-accept limits guide every AI negotiation."
      >
        <NegotiationConfigForm />
      </Panel>

      <Panel
        title="Recent orders"
        action={
          <Button asChild size="sm" variant="outline">
            <Link to="/dashboard">All orders</Link>
          </Button>
        }
      >
        <SellerOrders />
      </Panel>
    </div>
  );
}

function SellerDashboardPage() {
  const { user, isAuthenticated } = useSession();
  return (
    <PageShell>
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6 sm:py-14">
        <SectionHeading
          title="Seller dashboard"
          description="Everything you need to list, price and negotiate."
        />
        <SellerGate
          isAuthenticated={isAuthenticated}
          isSeller={isAuthenticated && user?.role === "seller"}
        >
          <SellerDashboard />
        </SellerGate>
      </div>
    </PageShell>
  );
}
