import { createFileRoute } from "@tanstack/react-router";
import { GlobalNav } from "@/components/layout/GlobalNav";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/landing/Hero";
import { InteractiveDemo } from "@/components/landing/InteractiveDemo";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { VizTypes } from "@/components/landing/VizTypes";
import { Comparison } from "@/components/landing/Comparison";
import { CallToAction } from "@/components/landing/CallToAction";
import { useSmoothScroll } from "@/hooks/useSmoothScroll";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CodeViz" },
      {
        name: "description",
        content:
          "Step through algorithm code line by line and watch arrays, DP tables and call stacks change. A visual debugger built for understanding, not just output.",
      },
      { property: "og:title", content: "CodeViz" },
      {
        property: "og:description",
        content: "A visual debugger for algorithms: step through code and watch state change.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  useSmoothScroll();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <GlobalNav />
      <main className="flex-1">
        <Hero />
        <InteractiveDemo />
        <HowItWorks />
        <VizTypes />
        <Comparison />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
}
