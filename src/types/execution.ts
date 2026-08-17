/**
 * The execution contract. Everything the UI renders is derived from this.
 *
 *   Code -> [Future Execution Engine] -> ExecutionEvent[] -> state machine
 *        -> pure visualization renderers
 *
 * Today the events are authored/generated in `src/data/mockExecutions`.
 * Nothing below assumes where they came from.
 */

export type VisualizationType =
  | "array"
  | "matrix"
  | "dp"
  | "variables"
  | "multiple"
  | "recursion"
  | "linkedlist"
  | "auto";

export type ChangeType = "update" | "insert" | "delete";

export type StateChange = {
  /** e.g. "nums", "dp", "left", "callstack" */
  structure: string;
  /** e.g. [2] for nums[2], [1,3] for dp[1][3] */
  path: number[];
  previousValue: unknown;
  nextValue: unknown;
  type: ChangeType;
};

export type CallFrame = {
  id: string;
  label: string;
  depth: number;
  parentId: string | null;
  status: "pending" | "active" | "returned";
  returnValue?: number | null | undefined;
};

export type ExecutionEvent = {
  step: number;
  line: number;
  variables: Record<string, unknown>;
  changes: StateChange[];
  explanation?: string | undefined;
  /** Snapshot of every tracked structure after this step. */
  snapshots?: Record<string, unknown> | undefined;
  /** Named pointers, e.g. { i: [3], j: [1] } */
  pointers?: Record<string, number[]> | undefined;
  /** Cells being compared / read this step. */
  highlighted?: { structure: string; path: number[] }[] | undefined;
  /** Cells the current value depends on (DP). */
  dependencies?: { structure: string; path: number[] }[] | undefined;
  /** Monospace recurrence formula for DP steps. */
  recurrence?: string | undefined;
  /** Call-stack shape for recursion traces. */
  callstack?: CallFrame[] | undefined;
};

export type InputData =
  | { kind: "array"; values: number[] }
  | { kind: "matrix"; values: number[][] }
  | { kind: "variables"; values: Record<string, unknown> };

export type UserConfig = {
  code: string;
  input: InputData;
  selectedVariable: string | null;
  visualizationType: VisualizationType;
};

export type ExecutionStatus =
  | "empty"
  | "missingInput"
  | "invalidInput"
  | "noTargetSelected"
  | "ready"
  | "running"
  | "paused"
  | "error"
  | "complete";

export type PlaybackSpeed = 0.5 | 1 | 2 | 4;

export type ExecutionState = {
  events: ExecutionEvent[];
  currentStep: number;
  isPlaying: boolean;
  speed: PlaybackSpeed;
  status: ExecutionStatus;
  error: { line: number; message: string } | null;
};

/** Derived, always a pure function of events[currentStep]. */
export type VisualizationState = {
  currentArray?: number[] | undefined;
  currentMatrix?: number[][] | undefined;
  structures: Record<string, unknown>;
  highlightedCells: number[][];
  changedCells: number[][];
  changeTypes: Record<string, ChangeType>;
  dependencyCells: number[][];
  pointers: Record<string, number[]>;
  variables: Record<string, unknown>;
  recurrence?: string | undefined;
  callstack?: CallFrame[] | undefined;
  line: number;
  step: number;
  changes: StateChange[];
  explanation?: string | undefined;
};