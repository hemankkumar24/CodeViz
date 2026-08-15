import { SiteShell } from "@/components/layout/site-shell"
import { Hero } from "@/components/landing/hero"
import { InteractiveDemo } from "@/components/landing/interactive-demo"
import { HowItWorks } from "@/components/landing/how-it-works"
import { VizTypes } from "@/components/landing/viz-types"
import { Comparison } from "@/components/landing/comparison"
import { CallToAction } from "@/components/landing/cta"

export default function Page() {
  return (
    <SiteShell>
      <Hero />
      <InteractiveDemo />
      <HowItWorks />
      <VizTypes />
      <Comparison />
      <CallToAction />
    </SiteShell>
  )
}
