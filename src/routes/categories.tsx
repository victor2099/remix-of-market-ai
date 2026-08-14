import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { PageShell } from "@/components/marketplace/page-shell";
import { SectionHeading } from "@/components/marketplace/primitives";
import { ErrorState } from "@/components/marketplace/states";
import { Skeleton } from "@/components/ui/skeleton";
import { categoriesQuery } from "@/lib/api/marketplace";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "Browse categories — Haggl" },
      {
        name: "description",
        content: "Explore phones, laptops, audio, wearables, fashion and home listings on Haggl.",
      },
      { property: "og:title", content: "Browse categories — Haggl" },
      { property: "og:description", content: "Find negotiable listings by category." },
    ],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const categories = useQuery(categoriesQuery());

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-6 sm:py-14">
        <SectionHeading
          title="Browse categories"
          description="Every category has verified sellers and negotiable listings."
        />
        {categories.isError ? (
          <ErrorState onRetry={() => categories.refetch()} />
        ) : categories.isPending ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.data.map((c) => (
              <Link
                key={c.id}
                to="/"
                search={{ q: c.label }}
                className="surface group flex items-center justify-between gap-4 p-5 transition-all hover:-translate-y-0.5 hover:shadow-raised"
              >
                <span className="min-w-0">
                  <span className="block text-base font-semibold text-foreground">{c.label}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {c.count.toLocaleString()} listings
                  </span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-brand" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
