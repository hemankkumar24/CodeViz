'use client'

import { useEffect, useRef, useState } from 'react'
import { Code2, ListFilter, Play } from 'lucide-react'

const steps = [
  {
    n: '01',
    title: 'Write',
    body: 'Bring your algorithm or paste code. No setup, no config.',
    icon: Code2,
  },
  {
    n: '02',
    title: 'Select',
    body: 'Choose the array, vector, matrix, DP table, or variables you want to observe.',
    icon: ListFilter,
  },
  {
    n: '03',
    title: 'Visualize',
    body: 'Step through execution and understand exactly how the state changes.',
    icon: Play,
  },
]

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setInView(true),
      { threshold: 0.35 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <section ref={ref} className="mx-auto max-w-7xl px-6 py-20">
      <div className="mb-12 max-w-2xl">
        <p className="text-xs font-medium tracking-wide text-tertiary uppercase">How it works</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Three steps from code to clarity.
        </h2>
      </div>

      <div className="relative">
        {/* connecting line */}
        <div className="absolute top-9 right-0 left-0 hidden h-px bg-white/[0.08] md:block">
          <div
            className="h-full bg-accent/70 transition-[width] duration-[1400ms] ease-out"
            style={{ width: inView ? '100%' : '0%' }}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((s) => {
            const Icon = s.icon
            return (
              <div
                key={s.n}
                className="surface-panel relative rounded-xl bg-surface-1 p-6"
              >
                <div className="mb-5 flex items-center justify-between">
                  <span className="font-mono text-2xl font-semibold text-accent tabular-nums">
                    {s.n}
                  </span>
                  <span className="flex size-9 items-center justify-center rounded-md border border-border bg-white/[0.03] text-muted-foreground">
                    <Icon className="size-[18px]" strokeWidth={1.5} />
                  </span>
                </div>
                <h3 className="text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground text-pretty">
                  {s.body}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
