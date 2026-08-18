import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/marketplace/page-shell";
import { EmptyState } from "@/components/marketplace/states";
import { SellerConsole } from "@/components/marketplace/seller-console";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/seller")({
  head: () => ({
    meta: [
      { title: "Seller dashboard — Haggl" },
      {
        name: "description",
        content:
          "Manage your store profile, listings, inventory, negotiation rules and orders in one seller workspace.",
      },
      { property: "og:title", content: "Seller dashboard — Haggl" },
      {
        property: "og:description",
        content: "Listings, inventory, negotiation rules and orders for Haggl sellers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SellerDashboardPage,
});

function SellerDashboardPage() {
  const { user, isAuthenticated } = useSession();
  const isSeller = isAuthenticated && user?.role === "seller";

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        {!isAuthenticated ? (
          <EmptyState
            title="Sign in to your seller account"
            description="Your store profile, listings and negotiation rules live here."
            action={
              <Button asChild>
                <Link to="/signin">Log in</Link>
              </Button>
            }
          />
        ) : !isSeller ? (
          <EmptyState
            title="This workspace is for sellers"
            description="Your account is a buyer account. Head to your buyer dashboard instead."
            action={
              <Button asChild>
                <Link to="/dashboard">Go to buyer dashboard</Link>
              </Button>
            }
          />
        ) : (
          <SellerConsole user={user} />
        )}
      </div>
    </PageShell>
  );
}
