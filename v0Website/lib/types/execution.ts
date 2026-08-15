// Core mock execution event model (spec §12). A real backend can emit this
// exact shape later without touching the UI layer.

export type VisualizationType =
  | 'array'
  | 'matrix'
  | 'dp'
  | 'variables'
  | 'multiple'
  | 'recursion'
  | 'auto'

export type StateChangeType = 'update' | 'insert' | 'delete'

export type StateChange = {
  /** which named structure changed, e.g. "nums", "dp", "left", "callstack" */
  structure: string
  /** coordinate path into the structure, e.g. [2] for nums[2], [1,3] for dp[1][3] */
  path: number[]
  previousValue: unknown
  nextValue: unknown
  type: StateChangeType
}

/** A single node in a call-stack / recursion trace. */
export type CallFrame = {
  id: string
  label: string // e.g. "fib(5)"
  parentId: string | null
  status: 'active' | 'pending' | 'returned'
  returnValue?: unknown
}

export type ExecutionEvent = {
  step: number
  line: number
  variables: Record<string, unknown>
  changes: StateChange[]
  explanation?: string
  /** For DP steps: dependency cells feeding the current cell. */
  dependencies?: number[][]
  /** For DP steps: the recurrence formula, monospace-rendered. */
  recurrence?: string
  /** For array/matrix: cells being compared this step (distinct from mutated). */
  comparing?: number[][]
  /** Pointers active this step, e.g. { i: [3], j: [1] }. */
  pointers?: Record<string, number[]>
  /** For recursion: the full call-stack snapshot at this step. */
  callstack?: CallFrame[]
}

// ----- User configuration (spec §11.1) -----

export type ArrayInput = { kind: 'array'; values: number[] }
export type MatrixInput = { kind: 'matrix'; values: number[][] }
export type VariablesInput = { kind: 'variables'; values: Record<string, number> }
export type InputData = ArrayInput | MatrixInput | VariablesInput

export type UserConfig = {
  code: string
  input: InputData | null
  selectedVariable: string | null
  visualizationType: VisualizationType
}

// ----- Execution runtime state (spec §11.2) -----

export type ExecutionStatus =
  | 'empty'
  | 'missingInput'
  | 'invalidInput'
  | 'noTargetSelected'
  | 'ready'
  | 'running'
  | 'paused'
  | 'error'
  | 'complete'

export type PlaybackSpeed = 0.5 | 1 | 2 | 4

export type ExecutionState = {
  events: ExecutionEvent[]
  currentStep: number
  isPlaying: boolean
  speed: PlaybackSpeed
  status: ExecutionStatus
  errorLine?: number
  errorMessage?: string
}

// ----- Derived visualization state (spec §11.3) -----

export type VisualizationState = {
  currentArray?: number[]
  currentMatrix?: number[][]
  highlightedCells: number[][]
  changedCells: number[][]
  changeTypes: Record<string, StateChangeType> // key = path.join(",")
  comparing: number[][]
  dependencies: number[][]
  pointers: Record<string, number[]>
  variables: Record<string, unknown>
  recurrence?: string
  callstack?: CallFrame[]
}
