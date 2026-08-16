import type { ExecutionEvent, StateChange } from "@/types/execution";

/** Small builder so authored traces stay readable and always step-numbered. */
export class TraceBuilder {
  private events: ExecutionEvent[] = [];

  push(e: Omit<ExecutionEvent, "step">) {
    this.events.push({ ...e, step: this.events.length + 1 });
    return this;
  }

  build(): ExecutionEvent[] {
    return this.events;
  }
}

export function change(
  structure: string,
  path: number[],
  previousValue: unknown,
  nextValue: unknown,
  type: StateChange["type"] = "update",
): StateChange {
  return { structure, path, previousValue, nextValue, type };
}

export const clone2d = (m: number[][]) => m.map((r) => [...r]);