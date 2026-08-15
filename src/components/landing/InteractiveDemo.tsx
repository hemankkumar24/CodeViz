import { CodeView } from '@/components/editor/CodeView'
import { ArrayVisualizerLanding } from '@/components/visualization/ArrayVisualizerLanding'
import { GlassCard } from '@/components/ui/GlassCard'
import { insertionSortCode, insertionSortTrace, deriveLandingVisualizationState } from '@/lib/landingTrace'
import { useTracePlayer } from '@/hooks/useTracePlayer'

const events = insertionSortTrace([5, 2, 4, 1])

export function InteractiveDemo() {
  const { step, setPaused } = useTracePlayer(events.length, { intervalMs: 1000, staticFrame: 6 })
  const viz = deriveLandingVisualizationState(events, step, {
    type: 'array',
    targetStructure: 'nums',
    initialArray: [5, 2, 4, 1],
  })
  const ev = events[step] ?? events[0]!

  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="mb-10 max-w-2xl">
        <p className="text-xs font-medium tracking-wide text-tertiary uppercase">Watch it happen</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          A line changes. The array moves. You understand.
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground text-pretty">
          Insertion sort, one step at a time. The highlighted line drives the array — no arrows
          in text, just real motion between real cells.
        </p>
      </div>

      <div
        className="grid gap-4 lg:grid-cols-2"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="surface-panel overflow-hidden rounded-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <span className="font-mono text-xs text-muted-foreground">insertion-sort.js</span>
            <span className="font-mono text-xs text-tertiary">line {ev.line}</span>
          </div>
          <CodeView code={insertionSortCode} currentLine={ev.line} autoScroll={false} className="py-3" />
        </div>

        <GlassCard className="flex flex-col justify-center gap-6 p-6">
          <ArrayVisualizerLanding
            values={viz.currentArray ?? [5, 2, 4, 1]}
            changedCells={viz.changedCells}
            comparing={viz.comparing}
            pointers={viz.pointers}
            changeTypes={viz.changeTypes}
            size="lg"
          />
          <p className="min-h-10 border-l-2 border-accent/60 pl-3 text-[13px] leading-relaxed text-muted-foreground">
            {ev.explanation}
          </p>
        </GlassCard>
      </div>
    </section>
  )
}
