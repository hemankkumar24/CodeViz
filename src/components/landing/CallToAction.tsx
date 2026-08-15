import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'

export function CallToAction() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-28 pt-8">
      <div className="glass relative overflow-hidden rounded-3xl border border-border/60 px-8 py-16 text-center sm:px-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              'radial-gradient(60% 120% at 50% 0%, color-mix(in oklch, var(--accent) 14%, transparent), transparent 70%)',
          }}
        />
        <div className="relative">
          <h2 className="mx-auto max-w-2xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            See your next algorithm run before you ship it.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-pretty text-base leading-relaxed text-muted-foreground">
            No install, no account. Paste a function, press Run, and watch every step unfold.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/visualize"
              className="group inline-flex h-11 items-center gap-2 rounded-full bg-accent px-6 text-sm font-medium text-accent-foreground shadow-glow transition-transform duration-200 hover:-translate-y-0.5"
            >
              Open the workspace
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/examples"
              className="inline-flex h-11 items-center rounded-full border border-border/70 px-6 text-sm font-medium text-foreground transition-colors hover:bg-surface-2/60"
            >
              Browse examples
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
