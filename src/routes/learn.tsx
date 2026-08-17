import { createFileRoute, Link } from "@tanstack/react-router";
import { GlobalNav } from "@/components/layout/GlobalNav";
import { Footer } from "@/components/layout/Footer";
import { Pill } from "@/components/ui/cv";
import { useSmoothScroll } from "@/hooks/useSmoothScroll";

export const Route = createFileRoute("/learn")({
  head: () => ({
    meta: [
      { title: "CodeViz" },
      {
        name: "description",
        content:
          "Short, highly visual interactive explainers on dynamic programming tables, call stacks, pointer patterns, and algorithm complexity.",
      },
      { property: "og:title", content: "CodeViz" },
      {
        property: "og:description",
        content: "Visual explainers on DP, recursion and sliding window, linked to runnable traces.",
      },
    ],
  }),
  component: LearnPage,
});

const articles = [
  {
    title: "Understanding Dynamic Programming",
    minutes: "6 min",
    slug: "fibonacci-dp",
    body: "A DP table is just a memory of answers you already computed. Each cell depends on a small set of earlier cells — once you can see those arrows, the recurrence stops feeling like magic.",
  },
  {
    title: "How Recursion Unfolds",
    minutes: "5 min",
    slug: "fib-recursion",
    body: "Recursion is a tree drawn in time. Frames push down until a base case, then return values climb back up. Watching the stack shrink is the fastest way to internalise it.",
  },
  {
    title: "The Sliding Window, Visually",
    minutes: "4 min",
    slug: "sliding-window",
    body: "Instead of recomputing every subarray, you move two boundaries and repair the running total. The window is the invariant — keep it valid and the answer falls out.",
  },
  {
    title: "Reading Binary Search Bounds",
    minutes: "4 min",
    slug: "binary-search",
    body: "Most binary search bugs are boundary bugs. Track low, high and mid on every step and the off-by-one becomes visible instead of theoretical.",
  },
];

function LearnPage() {
  useSmoothScroll();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <GlobalNav />

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-6 py-16">
        <header className="max-w-2xl">
          <h1 className="text-[34px] font-semibold leading-tight tracking-[-0.02em] text-foreground">
            Learn
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-text-secondary">
            Short explainers written to be read next to a running trace.
          </p>
        </header>

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          {articles.map((a) => (
            <article
              key={a.slug}
              className="flex flex-col gap-3 rounded-[16px] border border-hairline bg-surface-1/60 p-6"
            >
              <div className="flex items-center gap-2">
                <Pill>{a.minutes}</Pill>
              </div>
              <h2 className="text-[17px] font-medium text-foreground">{a.title}</h2>
              <p className="text-[13.5px] leading-relaxed text-text-secondary">{a.body}</p>
              <Link
                to="/visualize"
                search={{ example: a.slug }}
                className="mt-auto text-[13px] text-primary transition-opacity hover:opacity-80"
              >
                Open the trace →
              </Link>
            </article>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}