import { createFileRoute, Link } from "@tanstack/react-router";
import { GlobalNav } from "@/components/layout/GlobalNav";
import { Footer } from "@/components/layout/Footer";
import { CvButton } from "@/components/ui/cv";
import { useSmoothScroll } from "@/hooks/useSmoothScroll";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About CodeVisualizer" },
      {
        name: "description",
        content:
          "CodeVisualizer turns algorithm code into a stepped, visual trace so you can see state change instead of imagining it.",
      },
      { property: "og:title", content: "About CodeVisualizer" },
      {
        property: "og:description",
        content: "Why we built a visual debugger for algorithms, and what runs under the hood.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  useSmoothScroll();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <GlobalNav />

      <main className="mx-auto w-full max-w-[760px] flex-1 px-6 py-20">
        <h1 className="text-[34px] font-semibold leading-tight tracking-[-0.02em] text-foreground">
          Built to make state visible
        </h1>

        <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-text-secondary">
          <p>
            Reading an algorithm means simulating it in your head: which index moved, which cell was
            written, what the stack looked like three calls ago. CodeVisualizer does that simulation
            for you and draws it, one step at a time.
          </p>
          <p>
            Every visual in the app is derived from a single execution event stream — line number,
            variables, and the exact cells that changed. The renderers are pure: give them a
            snapshot and they draw it. That separation is what lets a real execution engine drop in
            later without touching the interface.
          </p>
          <p>
            Today the traces shipped with each example are authored, so the playback is exact and
            fast. The event contract is the same one an interpreter would emit.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link to="/visualize">
            <CvButton>Open the visualizer</CvButton>
          </Link>
          <Link to="/examples">
            <CvButton variant="outline">Browse examples</CvButton>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}