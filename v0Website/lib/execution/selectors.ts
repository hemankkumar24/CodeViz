import type {
  ExecutionEvent,
  VisualizationState,
  VisualizationType,
} from '@/lib/types/execution'

export type DeriveOptions = {
  type: VisualizationType
  /** name of the structure this canvas tracks, e.g. "nums" or "dp" */
  targetStructure: string
  initialArray?: number[]
  gridRows?: number
  gridCols?: number
}

const INF = '∞'
const toNum = (v: unknown): number => (v === INF || v === Infinity ? Infinity : Number(v))

/**
 * Pure selector: VisualizationState is ALWAYS derived from the event stream up
 * to `currentStep`. UI never sets it imperatively (spec §11.3 / §12).
 */
export function deriveVisualizationState(
  events: ExecutionEvent[],
  currentStep: number,
  opts: DeriveOptions,
): VisualizationState {
  const clamped = Math.max(0, Math.min(currentStep, events.length - 1))
  const event = events[clamped]
  const empty: VisualizationState = {
    highlightedCells: [],
    changedCells: [],
    changeTypes: {},
    comparing: [],
    dependencies: [],
    pointers: {},
    variables: {},
  }
  if (!event) return empty

  const { type, targetStructure } = opts

  // ---- reconstruct the current structure snapshot ----
  let currentArray: number[] | undefined
  let currentMatrix: number[][] | undefined

  if (type === 'array' || type === 'multiple' || type === 'variables' || type === 'auto') {
    if (opts.initialArray) {
      const arr = [...opts.initialArray]
      for (let s = 0; s <= clamped; s++) {
        for (const c of events[s].changes) {
          if (c.structure === targetStructure && c.path.length === 1) {
            arr[c.path[0]] = toNum(c.nextValue)
          }
        }
      }
      currentArray = arr
    }
  }

  if (type === 'dp' || type === 'matrix') {
    const rows = opts.gridRows ?? 1
    const cols = opts.gridCols ?? 1
    // seed each cell with the first previousValue we ever see for it
    const grid: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(0))
    const seeded = Array.from({ length: rows }, () => new Array(cols).fill(false))
    for (const ev of events) {
      for (const c of ev.changes) {
        if (c.structure !== targetStructure) continue
        const [r, cc] = c.path.length === 2 ? c.path : [0, c.path[0]]
        if (r < rows && cc < cols && !seeded[r][cc]) {
          grid[r][cc] = toNum(c.previousValue)
          seeded[r][cc] = true
        }
      }
    }
    // apply changes up to the current step
    for (let s = 0; s <= clamped; s++) {
      for (const c of events[s].changes) {
        if (c.structure !== targetStructure) continue
        const [r, cc] = c.path.length === 2 ? c.path : [0, c.path[0]]
        if (r < rows && cc < cols) grid[r][cc] = toNum(c.nextValue)
      }
    }
    currentMatrix = grid
  }

  // ---- current-step highlights ----
  const changedCells: number[][] = []
  const changeTypes: Record<string, VisualizationState['changeTypes'][string]> = {}
  for (const c of event.changes) {
    if (c.structure === targetStructure) {
      changedCells.push(c.path)
      changeTypes[c.path.join(',')] = c.type
    }
  }

  return {
    currentArray,
    currentMatrix,
    highlightedCells: event.comparing ?? [],
    changedCells,
    changeTypes,
    comparing: event.comparing ?? [],
    dependencies: event.dependencies ?? [],
    pointers: event.pointers ?? {},
    variables: event.variables ?? {},
    recurrence: event.recurrence,
    callstack: event.callstack,
  }
}

/** Steps that contain a mutation — used for timeline ticks / "next change". */
export function mutationSteps(events: ExecutionEvent[]): number[] {
  return events.filter((e) => e.changes.length > 0).map((e) => e.step)
}
