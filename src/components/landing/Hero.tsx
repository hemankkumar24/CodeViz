import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { ArrayVisualizerLanding } from '@/components/visualization/ArrayVisualizerLanding'
import { CodeView } from '@/components/editor/CodeView'
import { TimelineScrubber } from '@/components/execution/TimelineScrubber'
import { insertionSortCode, insertionSortTrace, deriveLandingVisualizationState, mutationSteps } from '@/lib/landingTrace'
import { useTracePlayer } from '@/hooks/useTracePlayer'

const events = insertionSortTrace([5, 2, 4, 1])
const muts = mutationSteps(events)

export function Hero() {
  const { step, setPaused, setStep } = useTracePlayer(events.length, { intervalMs: 950, staticFrame: 4 })
  const viz = deriveLandingVisualizationState(events, step, {
    type: 'array',
    targetStructure: 'nums',
    initialArray: [5, 2, 4, 1],
  })
  const ev = events[step] ?? events[0]!

  return (
    <section className="relative overflow-hidden">
      {/* single restrained ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-[-10%] right-[-5%] h-[420px] w-[520px] rounded-full opacity-40 blur-3xl"
        style={{
          background:
            'radial-gradient(closest-side, rgba(76,140,255,0.22), transparent 70%)',
        }}
      />
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 pt-16 pb-20 lg:grid-cols-[1.05fr_1fr] lg:pt-24 lg:pb-28">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white/[0.03] px-3 py-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            <span className="size-1.5 rounded-full bg-accent" />
            Now visualizing execution, not just output
          </span>
          <h1 className="mt-5 text-5xl leading-[1.02] font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
            See your code think.
          </h1>
          <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-muted-foreground text-pretty">
            Paste your algorithm, choose the state you want to track, and watch every
            meaningful change happen step by step.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/visualize"
              className="group relative inline-flex h-10 items-center justify-center gap-2 overflow-hidden rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground shadow transition-colors hover:bg-accent/90"
            >
              <span
                aria-hidden
                className="absolute inset-y-0 -left-1/3 w-1/4 -skew-x-12 bg-white/25 opacity-0 transition-all duration-500 group-hover:translate-x-[420%] group-hover:opacity-100"
              />
              Start Visualizing
              <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/examples"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-white/[0.04]"
            >
              Explore Examples
            </Link>
          </div>
        </div>

        {/* device frame mockup */}
        <div
          className="animate-scale-in"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="glass rounded-2xl p-3 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]">
            <div className="flex items-center gap-1.5 px-2 pb-2.5">
              <span className="size-2.5 rounded-full bg-white/15" />
              <span className="size-2.5 rounded-full bg-white/15" />
              <span className="size-2.5 rounded-full bg-white/15" />
              <span className="ml-2 font-mono text-[11px] text-tertiary">insertion-sort.js</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="surface-panel overflow-hidden rounded-lg">
                <CodeView
                  code={insertionSortCode}
                  currentLine={ev.line}
                  autoScroll={false}
                  className="max-h-[240px] py-2"
                />
              </div>
              <div className="surface-panel flex flex-col justify-between gap-3 rounded-lg p-3">
                <ArrayVisualizerLanding
                  values={viz.currentArray ?? [5, 2, 4, 1]}
                  changedCells={viz.changedCells}
                  comparing={viz.comparing}
                  pointers={viz.pointers}
                  changeTypes={viz.changeTypes}
                  size="sm"
                />
                <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-3 font-mono text-xs">
                  {Object.entries(ev.variables).map(([k, v]) => (
                    <span key={k} className="text-muted-foreground">
                      {k}
                      <span className="text-tertiary">=</span>
                      <span className="text-foreground">{String(v)}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-3 px-1">
              <TimelineScrubber
                total={events.length}
                current={step}
                mutationSteps={muts}
                onSeek={setStep}
                compact
                showChangeNav={false}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
