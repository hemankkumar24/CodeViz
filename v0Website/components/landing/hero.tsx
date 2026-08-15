'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ArrayVisualizer } from '@/components/visualization/array-visualizer'
import { CodeView } from '@/components/editor/code-view'
import { Timeline } from '@/components/execution/timeline'
import { insertionSortCode, insertionSortTrace } from '@/lib/data/mock-executions'
import { deriveVisualizationState, mutationSteps } from '@/lib/execution/selectors'
import { useTracePlayer } from '@/lib/hooks/use-trace-player'

const events = insertionSortTrace([5, 2, 4, 1])
const muts = mutationSteps(events)

export function Hero() {
  const { step, setPaused } = useTracePlayer(events.length, { intervalMs: 950, staticFrame: 4 })
  const viz = deriveVisualizationState(events, step, {
    type: 'array',
    targetStructure: 'nums',
    initialArray: [5, 2, 4, 1],
  })
  const ev = events[step]

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
            <Button
              size="lg"
              className="group relative overflow-hidden bg-accent text-accent-foreground hover:bg-accent/90"
              render={<Link href="/visualize" />} nativeButton={false}
            >
              <span
                aria-hidden
                className="absolute inset-y-0 -left-1/3 w-1/4 -skew-x-12 bg-white/25 opacity-0 transition-all duration-500 group-hover:translate-x-[420%] group-hover:opacity-100"
              />
              Start Visualizing
              <ArrowRight />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-border hover:bg-white/[0.04]"
              render={<Link href="/examples" />} nativeButton={false}
            >
              Explore Examples
            </Button>
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
                <ArrayVisualizer
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
              <Timeline
                total={events.length}
                current={step}
                mutationSteps={muts}
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
