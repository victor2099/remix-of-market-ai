import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { PageShell } from "@/components/marketplace/page-shell";
import { SectionHeading } from "@/components/marketplace/primitives";
import { CATEGORIES } from "@/lib/api/products";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "Browse categories — Haggl" },
      {
        name: "description",
        content: "Explore electronics, phones, computers, fashion and home listings on Haggl.",
      },
      { property: "og:title", content: "Browse categories — Haggl" },
      { property: "og:description", content: "Find negotiable listings by category." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-6 sm:py-14">
        <SectionHeading
          title="Browse categories"
          description="Every category has negotiable listings backed by seller agents."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((category) => (
            <Link
              key={category}
              to="/"
              search={{ category }}
              className="surface group flex items-center justify-between gap-4 p-5 transition-all hover:-translate-y-0.5 hover:shadow-raised"
            >
              <span className="min-w-0">
                <span className="block text-base font-semibold text-foreground">{category}</span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  See live listings and start a negotiation
                </span>
              </span>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-brand" />
            </Link>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
