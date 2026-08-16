import type {
  ExecutionEvent,
  ExecutionState,
  VisualizationState,
  ChangeType,
} from "@/types/execution";

const keyOf = (path: number[]) => path.join(",");

/**
 * The one and only place VisualizationState is produced. Pure function of
 * (events, currentStep, structure) — renderers never mutate or set state.
 */
export function selectVisualizationState(
  state: Pick<ExecutionState, "events" | "currentStep">,
  structure: string | null,
): VisualizationState | null {
  const event: ExecutionEvent | undefined = state.events[state.currentStep];
  if (!event) return null;

  const snapshots = event.snapshots ?? {};
  const target = structure ?? Object.keys(snapshots)[0] ?? null;
  const value = target ? snapshots[target] : undefined;

  const isMatrix =
    Array.isArray(value) && value.length > 0 && Array.isArray(value[0]);

  const changeTypes: Record<string, ChangeType> = {};
  const changedCells: number[][] = [];
  for (const c of event.changes) {
    if (target && c.structure !== target) continue;
    changedCells.push(c.path);
    changeTypes[keyOf(c.path)] = c.type;
  }

  return {
    currentArray: !isMatrix && Array.isArray(value) ? (value as number[]) : undefined,
    currentMatrix: isMatrix ? (value as number[][]) : undefined,
    structures: snapshots,
    highlightedCells: (event.highlighted ?? [])
      .filter((h) => !target || h.structure === target)
      .map((h) => h.path),
    changedCells,
    changeTypes,
    dependencyCells: (event.dependencies ?? [])
      .filter((d) => !target || d.structure === target)
      .map((d) => d.path),
    pointers: event.pointers ?? {},
    variables: event.variables ?? {},
    recurrence: event.recurrence,
    callstack: event.callstack,
    line: event.line,
    step: event.step,
    changes: event.changes,
    explanation: event.explanation,
  };
}

/** Steps that mutate state — used for the timeline ticks and change-jumping. */
export function selectMutationSteps(events: ExecutionEvent[]): number[] {
  return events.reduce<number[]>((acc, e, i) => {
    if (e.changes.length > 0) acc.push(i);
    return acc;
  }, []);
}

/** Names of structures present in a trace (for the "Multiple structures" mode). */
export function selectStructureNames(events: ExecutionEvent[]): string[] {
  const names = new Set<string>();
  for (const e of events) {
    for (const k of Object.keys(e.snapshots ?? {})) names.add(k);
  }
  return [...names];
}