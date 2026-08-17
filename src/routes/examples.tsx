import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { GlobalNav } from "@/components/layout/GlobalNav";
import { Footer } from "@/components/layout/Footer";
import { ExampleCard } from "@/components/examples/ExampleCard";
import { EmptyState } from "@/components/ui/cv";
import { allCategories, examples } from "@/data/examples";
import { cn } from "@/lib/utils";
import { useSmoothScroll } from "@/hooks/useSmoothScroll";

const searchSchema = z.object({ category: z.string().optional() });

export const Route = createFileRoute("/examples")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "CodeViz" },
      {
        name: "description",
        content:
          "Browse classic algorithms across sorting, graph traversal, and dynamic programming with interactive visual traces.",
      },
      { property: "og:title", content: "CodeViz" },
      {
        property: "og:description",
        content: "Traced sorting, searching, DP and recursion examples ready to step through.",
      },
    ],
  }),
  component: ExamplesPage,
});

function ExamplesPage() {
  useSmoothScroll();
  const { category } = Route.useSearch();
  const navigate = useNavigate();
  const filtered = category
    ? examples.filter((e) => e.categories.includes(category as never))
    : examples;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <GlobalNav />

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-6 py-16">
        <header className="max-w-2xl">
          <h1 className="text-[34px] font-semibold leading-tight tracking-[-0.02em] text-foreground">
            Examples
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-text-secondary">
            Every example ships with an authored execution trace. Open one and step through it
            line by line.
          </p>
        </header>

        <div className="mt-8 flex flex-wrap gap-2">
          {[undefined, ...allCategories].map((cat) => {
            const isActive = (!category && !cat) || category === cat;
            return (
              <button
                key={cat ?? "all"}
                type="button"
                onClick={() => navigate({ to: "/examples", search: cat ? { category: cat } : {} })}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[12.5px] transition-colors",
                  isActive
                    ? "border-primary/50 bg-primary/12 text-primary font-medium shadow-[0_0_10px_rgba(76,140,255,0.2)]"
                    : "border-hairline bg-surface-1 text-text-secondary hover:text-foreground",
                )}
              >
                {cat ?? "All"}
              </button>
            );
          })}
        </div>

        {filtered.length ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((ex) => (
              <ExampleCard key={ex.slug} example={ex} />
            ))}
          </div>
        ) : (
          <div className="mt-10">
            <EmptyState
              title="Nothing here yet"
              description="No examples in this category — more traces are being authored."
            />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}