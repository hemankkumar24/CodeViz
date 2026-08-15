const before = [
  "Scatter console.log calls across the file",
  "Re-run, scroll the terminal, lose your place",
  "Rebuild the loop in your head, frame by frame",
  "Guess which branch actually executed",
]

const after = [
  "Paste the function, hit Run once",
  "Scrub the timeline forward and backward",
  "Watch state change with the reason attached",
  "See the exact line and branch highlighted",
]

export function Comparison() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">The difference</p>
        <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Stop reading logs. Start watching execution.
        </h2>
      </div>

      <div className="mt-14 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-surface-1/40 p-8">
          <div className="mb-6 flex items-center gap-2">
            <span className="inline-flex h-6 items-center rounded-full bg-muted px-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              print debugging
            </span>
          </div>
          <ul className="flex flex-col gap-4">
            {before.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                <span
                  aria-hidden
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50"
                />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass relative overflow-hidden rounded-2xl border border-accent/25 p-8 shadow-glow">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/10 blur-3xl"
          />
          <div className="mb-6 flex items-center gap-2">
            <span className="inline-flex h-6 items-center rounded-full bg-accent/15 px-3 font-mono text-[11px] uppercase tracking-wider text-accent">
              trace debugging
            </span>
          </div>
          <ul className="flex flex-col gap-4">
            {after.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-foreground">
                <svg
                  aria-hidden
                  viewBox="0 0 20 20"
                  className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m5 10 3.5 3.5L15 6" />
                </svg>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
