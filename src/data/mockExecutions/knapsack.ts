import type { ExecutionEvent } from "@/types/execution";
import { TraceBuilder, change, clone2d } from "./helpers";

/** 0/1 Knapsack over a 2D DP table with dependency links. */
export function knapsackTrace(
  weights: number[] = [1, 3, 4, 5],
  values: number[] = [1, 4, 5, 7],
  capacity = 5,
): ExecutionEvent[] {
  const t = new TraceBuilder();
  const n = weights.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    Array.from({ length: capacity + 1 }, () => 0),
  );
  const snap = () => ({ dp: clone2d(dp) });

  t.push({
    line: 3,
    variables: { n, capacity },
    changes: [],
    snapshots: snap(),
    pointers: {},
    explanation: "Row 0 means no items chosen, so every capacity holds value 0.",
  });

  for (let i = 1; i <= n; i++) {
    const w = weights[i - 1] as number;
    const v = values[i - 1] as number;

    for (let c = 0; c <= capacity; c++) {
      const skip = dp[i - 1]![c] as number;

      if (w > c) {
        dp[i]![c] = skip;
        t.push({
          line: 8,
          variables: { i, c, weight: w, value: v },
          changes: [change("dp", [i, c], 0, skip)],
          snapshots: snap(),
          pointers: { i: [i], j: [c] },
          dependencies: [{ structure: "dp", path: [i - 1, c] }],
          recurrence: `dp[${i}][${c}] = dp[${i - 1}][${c}]`,
          explanation: `Item ${i} weighs ${w} and does not fit in capacity ${c}, so copy the row above.`,
        });
        continue;
      }

      const take = (dp[i - 1]![c - w] as number) + v;
      const best = Math.max(skip, take);
      dp[i]![c] = best;

      t.push({
        line: 10,
        variables: { i, c, weight: w, value: v, skip, take },
        changes: [change("dp", [i, c], 0, best)],
        snapshots: snap(),
        pointers: { i: [i], j: [c] },
        dependencies: [
          { structure: "dp", path: [i - 1, c] },
          { structure: "dp", path: [i - 1, c - w] },
        ],
        recurrence: `dp[${i}][${c}] = max(\n    dp[${i - 1}][${c}],\n    dp[${i - 1}][${c - w}] + value\n) = max(${skip}, ${take}) = ${best}`,
        explanation:
          take > skip
            ? `Taking item ${i} beats skipping it (${take} > ${skip}).`
            : `Skipping item ${i} is at least as good (${skip} >= ${take}).`,
      });
    }
  }

  t.push({
    line: 14,
    variables: { result: dp[n]![capacity] },
    changes: [],
    snapshots: snap(),
    pointers: { i: [n], j: [capacity] },
    explanation: `The bottom-right cell holds the answer: ${dp[n]![capacity]}.`,
  });

  return t.build();
}