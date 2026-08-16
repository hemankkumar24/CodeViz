import { createFileRoute, Link } from "@tanstack/react-router";
import { GlobalNav } from "@/components/layout/GlobalNav";
import { Footer } from "@/components/layout/Footer";
import { LandingDemo } from "@/components/landing/LandingDemo";
import { ExampleCard } from "@/components/examples/ExampleCard";
import { CvButton, Pill } from "@/components/ui/cv";
import { examples } from "@/data/examples";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CodeVisualizer — See your algorithm run" },
      {
        name: "description",
        content:
          "Step through algorithm code line by line and watch arrays, DP tables and call stacks change. A visual debugger built for understanding, not just output.",
      },
      { property: "og:title", content: "CodeVisualizer — See your algorithm run" },
      {
        property: "og:description",
        content: "A visual debugger for algorithms: step through code and watch state change.",
      },
    ],
  }),
  component: Index,
});

const capabilities = [
  {
    title: "Line-accurate stepping",
    body: "Every step maps to a line of your code. Scrub the timeline and the editor follows.",
  },
  {
    title: "Change-first highlighting",
    body: "Writes pulse once. Reads and comparisons stay quiet, so mutation is never ambiguous.",
  },
  {
    title: "DP dependencies drawn",
    body: "Each table cell shows the cells it was computed from, next to the recurrence itself.",
  },
  {
    title: "Call stacks as trees",
    body: "Recursion unfolds as a tree with live frames and return values climbing back up.",
  },
];

function Index() {
  const featured = examples.filter((e) => e.traced).slice(0, 3);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <GlobalNav />

      <main className="flex-1">
        <section className="ambient-accent relative mx-auto w-full max-w-[1400px] px-6 pb-14 pt-20 lg:pt-28">
          <div className="max-w-3xl">
            <Pill tone="glass">Visual debugger for algorithms</Pill>
            <h1 className="mt-5 text-[44px] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground sm:text-[60px]">
              See your algorithm
              <br />
              actually run.
            </h1>
            <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-text-secondary">
              Paste code, add input, and step through execution one line at a time — arrays,
              matrices, DP tables and call stacks, rendered exactly as they change.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/visualize">
                <CvButton size="lg">Start visualizing</CvButton>
              </Link>
              <Link to="/examples">
                <CvButton size="lg" variant="ghost">
                  Browse examples
                </CvButton>
              </Link>
            </div>
          </div>

          <div className="mt-14">
            <LandingDemo />
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1400px] border-t border-hairline px-6 py-16">
          <h2 className="text-[26px] font-semibold tracking-[-0.02em] text-foreground">
            Built for the moment code stops making sense
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {capabilities.map((c) => (
              <div key={c.title} className="rounded-[14px] border border-hairline bg-surface-1/60 p-5">
                <h3 className="text-[14.5px] font-medium text-foreground">{c.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-text-secondary">{c.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1400px] border-t border-hairline px-6 py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-[26px] font-semibold tracking-[-0.02em] text-foreground">
              Start from a traced example
            </h2>
            <Link to="/examples" className="text-[13.5px] text-primary hover:opacity-80">
              All examples →
            </Link>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((ex) => (
              <ExampleCard key={ex.slug} example={ex} />
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
