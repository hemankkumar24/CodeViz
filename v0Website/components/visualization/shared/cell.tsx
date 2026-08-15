'use client'

import { cn } from '@/lib/utils'
import type { StateChangeType } from '@/lib/types/execution'

export type CellState = 'default' | 'changed' | 'comparing' | 'current' | 'dep' | 'muted'

const sizeMap = {
  sm: 'h-9 w-9 text-[13px]',
  md: 'h-12 w-12 text-[15px]',
  lg: 'h-14 w-14 text-base',
}

export function Cell({
  value,
  state = 'default',
  changeType,
  size = 'md',
  className,
}: {
  value: number | string
  state?: CellState
  changeType?: StateChangeType
  size?: keyof typeof sizeMap
  className?: string
}) {
  const display = value === Infinity ? '∞' : value === '' ? '–' : String(value)
  const changeTone =
    changeType === 'insert'
      ? 'border-viz-insert/70 bg-viz-insert/10 text-viz-insert'
      : changeType === 'delete'
        ? 'border-viz-delete/70 bg-viz-delete/10 text-viz-delete'
        : 'border-viz-update/70 bg-viz-update/10 text-viz-update'

  return (
    <div
      className={cn(
        'relative flex items-center justify-center rounded-md border font-mono tabular-nums transition-colors duration-200',
        sizeMap[size],
        state === 'default' && 'border-border bg-white/[0.02] text-foreground',
        state === 'muted' && 'border-border/60 bg-transparent text-tertiary',
        state === 'current' && 'border-accent bg-accent/12 text-foreground',
        state === 'comparing' &&
          'border-dashed border-accent/70 bg-accent/[0.06] text-foreground',
        state === 'dep' && 'border-viz-dep/70 bg-viz-dep/10 text-viz-dep',
        state === 'changed' && cn(changeTone, 'animate-cell-pulse'),
        className,
      )}
    >
      <span key={display} className="animate-value-in">
        {display}
      </span>
    </div>
  )
}

export function PointerLabel({
  name,
  moved,
  direction = 'down',
}: {
  name: string
  moved?: boolean
  direction?: 'up' | 'down'
}) {
  return (
    <span
      className={cn(
        'flex flex-col items-center font-mono text-[11px] leading-none transition-colors',
        moved ? 'text-accent' : 'text-muted-foreground',
      )}
    >
      {direction === 'down' ? (
        <>
          <span>{name}</span>
          <span aria-hidden className="mt-0.5">
            ↓
          </span>
        </>
      ) : (
        <>
          <span aria-hidden className="mb-0.5">
            ↑
          </span>
          <span>{name}</span>
        </>
      )}
    </span>
  )
}
