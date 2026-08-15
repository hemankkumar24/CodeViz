'use client'

import { cn } from '@/lib/utils'
import type { StateChangeType } from '@/lib/types/execution'
import { Cell, PointerLabel, type CellState } from './shared/cell'

export type ArrayVisualizerProps = {
  values: number[]
  changedCells?: number[][]
  comparing?: number[][]
  pointers?: Record<string, number[]>
  changeTypes?: Record<string, StateChangeType>
  size?: 'sm' | 'md' | 'lg'
  showIndices?: boolean
  label?: string
  className?: string
}

const has = (cells: number[][] | undefined, i: number) =>
  !!cells?.some((c) => c.length === 1 && c[0] === i)

export function ArrayVisualizer({
  values,
  changedCells,
  comparing,
  pointers = {},
  changeTypes = {},
  size = 'md',
  showIndices = true,
  label,
  className,
}: ArrayVisualizerProps) {
  // index -> pointer names
  const pointerMap: Record<number, string[]> = {}
  for (const [name, path] of Object.entries(pointers)) {
    if (path.length === 1) {
      const idx = path[0]
      if (idx >= 0 && idx < values.length) (pointerMap[idx] ||= []).push(name)
    }
  }

  const large = values.length > 22
  const cellSize = large ? 'sm' : size

  const stateFor = (i: number): CellState => {
    if (has(changedCells, i)) return 'changed'
    if (has(comparing, i)) return 'comparing'
    if (pointerMap[i]?.length) return 'current'
    return 'default'
  }

  return (
    <div className={cn('w-full', className)}>
      {label ? (
        <div className="mb-2 font-mono text-xs text-muted-foreground">{label}</div>
      ) : null}
      <div
        className={cn(
          'flex w-full',
          large ? 'cv-scrollbar fade-edge-x overflow-x-auto pb-1' : 'justify-center',
        )}
      >
        <div className="flex flex-col gap-1">
          {/* pointers above */}
          <div className="flex gap-1.5">
            {values.map((_, i) => (
              <div
                key={i}
                className={cn(
                  'flex min-h-6 flex-col items-center justify-end gap-0.5',
                  large ? 'w-9' : size === 'lg' ? 'w-14' : 'w-12',
                )}
              >
                {pointerMap[i]?.map((name) => (
                  <PointerLabel key={name} name={name} moved direction="down" />
                ))}
              </div>
            ))}
          </div>
          {/* cells */}
          <div className="flex gap-1.5">
            {values.map((v, i) => (
              <Cell
                key={i}
                value={v}
                state={stateFor(i)}
                changeType={changeTypes[String(i)]}
                size={cellSize}
              />
            ))}
          </div>
          {/* indices below */}
          {showIndices ? (
            <div className="flex gap-1.5">
              {values.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'text-center font-mono text-[11px] text-tertiary',
                    large ? 'w-9' : size === 'lg' ? 'w-14' : 'w-12',
                  )}
                >
                  {i}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
