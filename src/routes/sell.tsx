import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, MessagesSquare, Wallet } from "lucide-react";
import { PageShell } from "@/components/marketplace/page-shell";
import { SectionHeading } from "@/components/marketplace/primitives";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/sell")({
  head: () => ({
    meta: [
      { title: "Start selling on Haggl" },
      {
        name: "description",
        content:
          "List your products, set a negotiation floor and let buyers make structured offers you can accept in one tap.",
      },
      { property: "og:title", content: "Start selling on Haggl" },
      {
        property: "og:description",
        content: "List once, negotiate on your terms and get paid through escrow.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SellPage,
});

const steps = [
  {
    icon: BadgeCheck,
    title: "Get verified",
    body: "Confirm your identity once and carry a verified badge across every listing.",
  },
  {
    icon: MessagesSquare,
    title: "Set your floor",
    body: "Choose the lowest price you'd accept. Offers below it are declined automatically.",
  },
  {
    icon: Wallet,
    title: "Get paid via escrow",
    body: "Funds are held until delivery is confirmed, so both sides stay protected.",
  },
];

function SellPage() {
  const { user, isAuthenticated } = useSession();
  const isSeller = isAuthenticated && user?.role === "seller";

  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Sell with negotiation built in
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          List a product once and let buyers negotiate within limits you control. No haggling in your
          DMs, no lowball surprises.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {isSeller ? (
            <Button asChild size="lg">
              <Link to="/seller">Open your seller dashboard</Link>
            </Button>
          ) : isAuthenticated ? (
            <Button asChild size="lg">
              <Link to="/dashboard">Go to your buyer dashboard</Link>
            </Button>
          ) : (
            <Button asChild size="lg">
              <Link to="/signup">Create a seller account</Link>
            </Button>
          )}
          <Button asChild size="lg" variant="outline">
            <Link to="/">Browse the marketplace</Link>
          </Button>
        </div>

        <div className="mt-14">
          <SectionHeading title="How it works" />
          <ol className="mt-5 space-y-4">
            {steps.map((step, i) => (
              <li key={step.title} className="surface flex gap-4 p-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                  <step.icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-foreground">
                    {i + 1}. {step.title}
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </PageShell>
  );
}
