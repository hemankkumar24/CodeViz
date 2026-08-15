'use client'

import { useCallback, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Timeline({
  total,
  current,
  mutationSteps = [],
  onSeek,
  onPrevChange,
  onNextChange,
  compact = false,
  showChangeNav = true,
  className,
}: {
  total: number
  current: number
  mutationSteps?: number[]
  onSeek?: (step: number) => void
  onPrevChange?: () => void
  onNextChange?: () => void
  compact?: boolean
  showChangeNav?: boolean
  className?: string
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const lastMax = Math.max(total - 1, 0)
  const pct = lastMax === 0 ? 0 : (current / lastMax) * 100
  const mutationSet = new Set(mutationSteps)
  const dense = total > 60

  const seekFromClientX = useCallback(
    (clientX: number) => {
      if (!onSeek || !trackRef.current) return
      const rect = trackRef.current.getBoundingClientRect()
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
      onSeek(Math.round(ratio * lastMax))
    },
    [onSeek, lastMax],
  )

  const onPointerDown = (e: React.PointerEvent) => {
    if (!onSeek) return
    dragging.current = true
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    seekFromClientX(e.clientX)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragging.current) seekFromClientX(e.clientX)
  }
  const onPointerUp = () => {
    dragging.current = false
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {showChangeNav && onPrevChange ? (
        <button
          onClick={onPrevChange}
          aria-label="Previous change"
          className="hidden shrink-0 rounded-md border border-border p-1 text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground sm:inline-flex"
        >
          <ChevronLeft className="size-3.5" />
        </button>
      ) : null}

      <div className="min-w-0 flex-1">
        <div
          ref={trackRef}
          role={onSeek ? 'slider' : undefined}
          aria-valuemin={0}
          aria-valuemax={lastMax}
          aria-valuenow={current}
          aria-label="Execution timeline"
          tabIndex={onSeek ? 0 : undefined}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onKeyDown={(e) => {
            if (!onSeek) return
            if (e.key === 'ArrowRight') onSeek(Math.min(lastMax, current + 1))
            if (e.key === 'ArrowLeft') onSeek(Math.max(0, current - 1))
          }}
          className={cn(
            'relative flex touch-none items-center',
            compact ? 'h-5' : 'h-7',
            onSeek && 'cursor-pointer',
          )}
        >
          {/* base track */}
          <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-white/[0.08]" />
          {/* progress */}
          <div
            className="absolute top-1/2 left-0 h-0.5 -translate-y-1/2 rounded-full bg-accent/70"
            style={{ width: `${pct}%` }}
          />
          {/* ticks */}
          {!dense &&
            Array.from({ length: total }).map((_, i) => {
              const isMut = mutationSet.has(i)
              const p = lastMax === 0 ? 0 : (i / lastMax) * 100
              return (
                <span
                  key={i}
                  className={cn(
                    'absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full',
                    isMut
                      ? 'size-1.5 bg-accent/80'
                      : 'size-1 bg-white/25',
                    i <= current && !isMut && 'bg-accent/40',
                  )}
                  style={{ left: `${p}%` }}
                />
              )
            })}
          {/* scrubber */}
          <span
            className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${pct}%` }}
          >
            <span className="block size-3.5 rounded-full border border-accent bg-background shadow-[0_0_0_4px_rgba(76,140,255,0.18)]" />
          </span>
        </div>
      </div>

      {showChangeNav && onNextChange ? (
        <button
          onClick={onNextChange}
          aria-label="Next change"
          className="hidden shrink-0 rounded-md border border-border p-1 text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground sm:inline-flex"
        >
          <ChevronRight className="size-3.5" />
        </button>
      ) : null}

      <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
        {Math.min(current + 1, total)} / {total}
      </span>
    </div>
  )
}
