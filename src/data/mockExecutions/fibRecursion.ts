import type { CallFrame, ExecutionEvent } from "@/types/execution";
import { TraceBuilder } from "./helpers";

/**
 * Naive recursive fib(5) — a call-stack trace.
 * Every event carries the full tree shape so the renderer stays pure.
 */
export function fibRecursionTrace(n = 5): ExecutionEvent[] {
  const t = new TraceBuilder();
  const frames: CallFrame[] = [];
  let counter = 0;

  const snapshot = (): CallFrame[] => frames.map((f) => ({ ...f }));

  function walk(value: number, parentId: string | null, depth: number): number {
    const id = `f${counter++}`;
    frames.push({
      id,
      label: `fib(${value})`,
      depth,
      parentId,
      status: "active",
    });

    t.push({
      line: value <= 1 ? 2 : 4,
      variables: { n: value, depth },
      changes: [],
      snapshots: { callstack: snapshot() },
      callstack: snapshot(),
      explanation: `Call fib(${value}).`,
    });

    let result: number;
    if (value <= 1) {
      result = value;
    } else {
      const left = walk(value - 1, id, depth + 1);
      const right = walk(value - 2, id, depth + 1);
      result = left + right;
    }

    const frame = frames.find((f) => f.id === id)!;
    frame.status = "returned";
    frame.returnValue = result;

    t.push({
      line: value <= 1 ? 2 : 4,
      variables: { n: value, depth, returns: result },
      changes: [
        {
          structure: "callstack",
          path: [depth],
          previousValue: null,
          nextValue: result,
          type: "update",
        },
      ],
      snapshots: { callstack: snapshot() },
      callstack: snapshot(),
      explanation:
        value <= 1
          ? `Base case: fib(${value}) returns ${result} immediately.`
          : `fib(${value}) returns ${result} to its caller.`,
    });

    return result;
  }

  walk(n, null, 0);
  return t.build();
}