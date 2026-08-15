import { cn } from '@/lib/utils'

function MiniArray() {
  const vals = [5, 2, 4, 1, 7]
  return (
    <div className="flex items-end gap-1">
      {vals.map((v, i) => (
        <div
          key={i}
          className={cn(
            'flex size-7 items-center justify-center rounded border font-mono text-[11px]',
            i === 1
              ? 'border-accent bg-accent/12 text-foreground'
              : 'border-border bg-white/[0.02] text-muted-foreground',
          )}
        >
          {v}
        </div>
      ))}
    </div>
  )
}

function MiniDP() {
  return (
    <div className="relative">
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        aria-hidden
      >
        <defs>
          <marker id="dp-arrow" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#A78BFA" />
          </marker>
        </defs>
        <line x1="14" y1="14" x2="58" y2="58" stroke="#A78BFA" strokeWidth="1.5" markerEnd="url(#dp-arrow)" />
      </svg>
      <div className="grid grid-cols-3 gap-1">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'flex size-7 items-center justify-center rounded border font-mono text-[11px]',
              i === 0 && 'border-viz-dep/70 bg-viz-dep/10 text-viz-dep',
              i === 8 && 'border-accent bg-accent/12 text-foreground',
              i !== 0 && i !== 8 && 'border-border bg-white/[0.02] text-tertiary',
            )}
          >
            {i === 8 ? 5 : i === 0 ? 2 : ''}
          </div>
        ))}
      </div>
    </div>
  )
}

function MiniMatrix() {
  const m = [3, 1, 4, 1, 5, 9, 2, 6, 5]
  return (
    <div className="grid grid-cols-3 gap-1">
      {m.map((v, i) => (
        <div
          key={i}
          className="flex size-7 items-center justify-center rounded border border-border bg-white/[0.02] font-mono text-[11px] text-muted-foreground"
        >
          {v}
        </div>
      ))}
    </div>
  )
}

function MiniVars() {
  return (
    <div className="space-y-1.5 font-mono text-[12px]">
      <div className="flex items-center gap-3">
        <span className="w-8 text-muted-foreground">i</span>
        <span className="text-foreground">3</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="w-8 text-muted-foreground">sum</span>
        <span className="text-tertiary line-through">11</span>
        <span className="text-tertiary">→</span>
        <span className="text-accent">12</span>
      </div>
    </div>
  )
}

function MiniRecursion() {
  return (
    <div className="font-mono text-[11px] leading-tight text-muted-foreground">
      <div className="text-foreground">fib(5)</div>
      <div className="ml-2 mt-0.5 border-l border-border pl-2">
        <div>├─ fib(4)</div>
        <div>└─ fib(3)</div>
      </div>
    </div>
  )
}

function MiniGraph() {
  return (
    <svg viewBox="0 0 80 56" className="h-14 w-20" aria-hidden>
      <line x1="16" y1="14" x2="44" y2="14" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
      <line x1="16" y1="14" x2="24" y2="42" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
      <line x1="44" y1="14" x2="60" y2="42" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
      {[
        [16, 14],
        [44, 14],
        [24, 42],
        [60, 42],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="5" fill="#17171B" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
      ))}
    </svg>
  )
}

const tiles = [
  { title: 'Arrays', desc: 'Cells, pointers, and value swaps.', render: <MiniArray /> },
  { title: 'DP Tables', desc: 'Cells with dependency links.', render: <MiniDP /> },
  { title: 'Matrices', desc: 'Plain 2D grids, no dependencies.', render: <MiniMatrix /> },
  { title: 'Variables', desc: 'Scalar state, transition by transition.', render: <MiniVars /> },
  { title: 'Recursion', desc: 'Call trees that unfold and resolve.', render: <MiniRecursion /> },
  { title: 'Graphs & Trees', desc: 'Nodes and edges.', render: <MiniGraph />, soon: true },
]

export function VizTypes() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="mb-12 max-w-2xl">
        <p className="text-xs font-medium tracking-wide text-tertiary uppercase">
          What you can watch
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          One visual language, many structures.
        </h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((t) => (
          <div
            key={t.title}
            className={cn(
              'surface-panel group relative rounded-xl bg-surface-1 p-6 transition-all duration-200 hover:-translate-y-1 hover:border-border-strong',
              t.soon && 'opacity-70',
            )}
          >
            {t.soon ? (
              <span className="glass absolute top-4 right-4 rounded-full px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                Coming soon
              </span>
            ) : null}
            <div className="flex h-20 items-center">{t.render}</div>
            <h3 className="mt-4 font-semibold">{t.title}</h3>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{t.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
