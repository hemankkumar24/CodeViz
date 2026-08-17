/**
 * Tracer — converts raw interpreter state into ExecutionEvent[].
 *
 * Responsibilities:
 * - Snapshot diffing to produce StateChange[]
 * - Auto-detect pointers (i, j, left, right, mid, etc.)
 * - Auto-detect structure types (array, matrix, callstack)
 * - Generate template-based explanations from AST context
 */

import type { ExecutionEvent, StateChange, CallFrame, ChangeType } from "@/types/execution";

/* ---------------------- Snapshot & Diff utilities ----------------------- */

/** Deep clone a value (handles arrays, plain objects, cycles, primitives). */
export function deepClone<T>(value: T, seen = new Map<object, any>()): T {
  if (value === null || value === undefined) return value;
  if (typeof value !== "object") return value;
  if (seen.has(value as object)) {
    return seen.get(value as object);
  }
  if (Array.isArray(value)) {
    const arr: any[] = [];
    seen.set(value as object, arr);
    for (let i = 0; i < value.length; i++) {
      arr[i] = deepClone(value[i], seen);
    }
    return arr as T;
  }
  if (value instanceof Set) {
    const set = new Set();
    seen.set(value as object, set);
    for (const item of value) set.add(deepClone(item, seen));
    return set as T;
  }
  if (value instanceof Map) {
    const map = new Map();
    seen.set(value as object, map);
    for (const [k, v] of value) map.set(k, deepClone(v, seen));
    return map as T;
  }
  const obj: Record<string, unknown> = {};
  seen.set(value as object, obj);
  for (const key of Object.keys(value as Record<string, unknown>)) {
    obj[key] = deepClone((value as Record<string, unknown>)[key], seen);
  }
  return obj as T;
}

/** Check if a value is a ListNode object. */
export function isListNode(v: unknown): boolean {
  return v !== null && typeof v === "object" && "val" in v && ("next" in v || (v as any).next === null);
}

/** Names that are auto-detected as index pointers into arrays. */
const POINTER_NAMES = new Set([
  "i", "j", "k", "l", "m", "n",
  "left", "right", "mid", "lo", "hi", "low", "high",
  "start", "end", "head", "tail", "top", "bottom",
  "idx", "index", "pos", "ptr", "cursor",
  "p", "q", "r", "s",
  "row", "col", "x", "y",
]);

/** Detect which variables are index pointers (small non-negative integers). */
export function detectPointers(variables: Record<string, unknown>): Record<string, number[]> {
  const pointers: Record<string, number[]> = {};
  for (const [name, value] of Object.entries(variables)) {
    if (
      POINTER_NAMES.has(name) &&
      typeof value === "number" &&
      Number.isInteger(value) &&
      value >= -1 && // allow -1 for "before start" situations
      value < 10000
    ) {
      pointers[name] = [value];
    }
  }
  return pointers;
}

/** Check if a value is a 1D numeric array. */
export function is1DArray(v: unknown): v is (number | null)[] {
  return Array.isArray(v) && v.length > 0 && v.every(
    (x) => typeof x === "number" || x === null || x === undefined,
  );
}

/** Check if a value is a 2D numeric matrix. */
export function is2DMatrix(v: unknown): v is (number | null)[][] {
  return (
    Array.isArray(v) &&
    v.length > 0 &&
    Array.isArray(v[0]) &&
    v.every(
      (row) =>
        Array.isArray(row) &&
        row.every((x: unknown) => typeof x === "number" || x === null || x === undefined),
    )
  );
}

/** Auto-detect which variables are visualizable structures. */
export function detectStructures(variables: Record<string, unknown>): Record<string, unknown> {
  const structures: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(variables)) {
    if (is2DMatrix(value)) {
      structures[name] = deepClone(value);
    } else if (is1DArray(value)) {
      structures[name] = deepClone(value);
    } else if (Array.isArray(value)) {
      // Non-numeric arrays — still track them
      structures[name] = deepClone(value);
    } else if (value instanceof Set) {
      structures[name] = [...value];
    } else if (value instanceof Map) {
      structures[name] = Object.fromEntries(value);
    } else if (isListNode(value)) {
      structures[name] = deepClone(value);
    }
  }
  return structures;
}

/** Diff two snapshots of the same structure to produce StateChange[]. */
export function diffSnapshots(
  structureName: string,
  prev: unknown,
  next: unknown,
): StateChange[] {
  const changes: StateChange[] = [];

  // 1D array diff
  if (is1DArray(prev) && is1DArray(next)) {
    const maxLen = Math.max(prev.length, next.length);
    for (let i = 0; i < maxLen; i++) {
      const pv = i < prev.length ? prev[i] : undefined;
      const nv = i < next.length ? next[i] : undefined;
      if (pv !== nv) {
        let type: ChangeType = "update";
        if (i >= prev.length) type = "insert";
        else if (i >= next.length) type = "delete";
        changes.push({
          structure: structureName,
          path: [i],
          previousValue: pv,
          nextValue: nv,
          type,
        });
      }
    }
    return changes;
  }

  // 2D matrix diff
  if (is2DMatrix(prev) && is2DMatrix(next)) {
    const maxRows = Math.max(prev.length, next.length);
    for (let r = 0; r < maxRows; r++) {
      const prevRow = r < prev.length ? prev[r]! : [];
      const nextRow = r < next.length ? next[r]! : [];
      const maxCols = Math.max(prevRow.length, nextRow.length);
      for (let c = 0; c < maxCols; c++) {
        const pv = c < prevRow.length ? prevRow[c] : undefined;
        const nv = c < nextRow.length ? nextRow[c] : undefined;
        if (pv !== nv) {
          let type: ChangeType = "update";
          if (r >= prev.length || c >= prevRow.length) type = "insert";
          else if (r >= next.length || c >= nextRow.length) type = "delete";
          changes.push({
            structure: structureName,
            path: [r, c],
            previousValue: pv,
            nextValue: nv,
            type,
          });
        }
      }
    }
    return changes;
  }

  return changes;
}

/* ----------------------------- Tracer ------------------------------------ */

export type StepContext = {
  line: number;
  nodeType: string;
  variables: Record<string, unknown>;
  explanation?: string;
  callstack?: CallFrame[];
  /** Source text of the current expression/statement (for explanations). */
  sourceText?: string;
};

export class Tracer {
  private events: ExecutionEvent[] = [];
  private prevStructures: Record<string, unknown> = {};

  /** Record a step from the interpreter. */
  record(ctx: StepContext): void {
    const variables = deepClone(ctx.variables);
    const structures = detectStructures(variables);
    const pointers = detectPointers(variables);

    // Diff structures against previous step
    const changes: StateChange[] = [];
    const allKeys = new Set([...Object.keys(structures), ...Object.keys(this.prevStructures)]);
    for (const key of allKeys) {
      const prev = this.prevStructures[key];
      const next = structures[key];
      if (prev === undefined && next !== undefined) {
        // New structure appeared — no diff needed, first time
      } else if (prev !== undefined && next !== undefined) {
        changes.push(...diffSnapshots(key, prev, next));
      }
    }

    // Build highlighted cells from pointers and changes targeting known structures
    const highlighted: { structure: string; path: number[] }[] = [];

    // 1. Changes to structures are automatically highlighted
    for (const c of changes) {
      highlighted.push({ structure: c.structure, path: c.path });
    }

    // 2. Active 2D matrix / DP table cell highlighting
    for (const [sName, sVal] of Object.entries(structures)) {
      if (is2DMatrix(sVal) && sVal.length > 0) {
        const rows = sVal.length;
        const cols = sVal[0]?.length ?? 0;

        const rowKeys = ["i", "r", "row", "y", "u", "node"];
        const colKeys = ["j", "w", "c", "col", "x", "v", "k"];

        let rVal: number | undefined = undefined;
        let cVal: number | undefined = undefined;

        for (const k of rowKeys) {
          const v = variables[k];
          if (typeof v === "number" && v >= 0 && v < rows) {
            rVal = v;
            break;
          }
        }

        for (const k of colKeys) {
          const v = variables[k];
          if (typeof v === "number" && v >= 0 && v < cols) {
            cVal = v;
            break;
          }
        }

        if (rVal !== undefined && cVal !== undefined) {
          // Both row and column pointers are active -> exact intersecting cell!
          highlighted.push({ structure: sName, path: [rVal, cVal] });
        } else if (rVal !== undefined) {
          // Only row pointer active -> highlight cells in row rVal
          for (let c = 0; c < cols; c++) {
            highlighted.push({ structure: sName, path: [rVal, c] });
          }
        } else if (cVal !== undefined) {
          // Only column pointer active -> highlight cells in column cVal
          for (let r = 0; r < rows; r++) {
            highlighted.push({ structure: sName, path: [r, cVal] });
          }
        }
      } else if (is1DArray(sVal)) {
        // 1D array index highlighting
        for (const [pName, pPath] of Object.entries(pointers)) {
          const idx = pPath[0];
          if (typeof idx === "number" && idx >= 0 && idx < sVal.length) {
            highlighted.push({ structure: sName, path: [idx] });
          }
          void pName;
        }
      }
    }

    const event: ExecutionEvent = {
      step: this.events.length + 1,
      line: ctx.line,
      variables: filterScalarVariables(variables),
      changes,
      snapshots: Object.keys(structures).length ? structures : undefined,
      pointers: Object.keys(pointers).length ? pointers : undefined,
      highlighted: highlighted.length ? highlighted : undefined,
      explanation: ctx.explanation,
      callstack: ctx.callstack ? deepClone(ctx.callstack) : undefined,
    };

    this.events.push(event);
    this.prevStructures = structures;
  }

  /** Get the final list of execution events. */
  build(): ExecutionEvent[] {
    return this.events;
  }

  /** Reset for a new run. */
  reset(): void {
    this.events = [];
    this.prevStructures = {};
  }

  get stepCount(): number {
    return this.events.length;
  }
}

/** Filter variables to only include scalar/simple values for the variable inspector. */
function filterScalarVariables(vars: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(vars)) {
    if (
      typeof value === "number" ||
      typeof value === "string" ||
      typeof value === "boolean" ||
      value === null ||
      value === undefined
    ) {
      result[key] = value;
    } else if (is1DArray(value)) {
      result[key] = value;
    } else if (is2DMatrix(value)) {
      result[key] = value;
    }
  }
  return result;
}

/* ---------------------- Explanation generation --------------------------- */

export function generateExplanation(
  nodeType: string,
  variables: Record<string, unknown>,
  sourceText?: string,
): string {
  switch (nodeType) {
    case "ForStatement":
    case "ForInStatement":
    case "ForOfStatement": {
      const loopVar = Object.entries(variables).find(
        ([k]) => k === "i" || k === "j" || k === "k",
      );
      if (loopVar) return `Loop iteration: ${loopVar[0]} = ${loopVar[1]}`;
      return "Enter loop iteration.";
    }
    case "WhileStatement":
      return "Evaluate while-loop condition.";
    case "IfStatement":
      if (sourceText) {
        const cond = sourceText.length > 50 ? sourceText.slice(0, 50) + "…" : sourceText;
        return `Evaluate condition: ${cond}`;
      }
      return "Evaluate if-condition.";
    case "ReturnStatement":
      return sourceText ? `Return ${sourceText}` : "Return from function.";
    case "VariableDeclaration":
      return sourceText ? `Declare: ${sourceText}` : "Variable declaration.";
    case "AssignmentExpression":
    case "UpdateExpression":
      return sourceText ? `${sourceText}` : "Assignment.";
    case "CallExpression":
      return sourceText ? `Call: ${sourceText}` : "Function call.";
    default:
      return "";
  }
}
