import type { ExecutionEvent } from "@/types/execution";
import { TraceBuilder, change } from "./helpers";

/** Bottom-up Fibonacci over a 1D DP table, with dependency links. */
export function fibonacciDPTrace(n = 9): ExecutionEvent[] {
  const t = new TraceBuilder();
  const dp: (number | null)[] = Array.from({ length: n + 1 }, () => null);
  const snap = () => ({ dp: [...dp] });

  dp[0] = 0;
  t.push({
    line: 3,
    variables: { n },
    changes: [change("dp", [0], null, 0)],
    snapshots: snap(),
    pointers: { i: [0] },
    recurrence: "dp[0] = 0",
    explanation: "Base case: fib(0) is 0.",
  });

  dp[1] = 1;
  t.push({
    line: 4,
    variables: { n },
    changes: [change("dp", [1], null, 1)],
    snapshots: snap(),
    pointers: { i: [1] },
    recurrence: "dp[1] = 1",
    explanation: "Base case: fib(1) is 1.",
  });

  for (let i = 2; i <= n; i++) {
    const a = dp[i - 1] as number;
    const b = dp[i - 2] as number;

    t.push({
      line: 6,
      variables: { i, n },
      changes: [],
      snapshots: snap(),
      pointers: { i: [i] },
      dependencies: [
        { structure: "dp", path: [i - 1] },
        { structure: "dp", path: [i - 2] },
      ],
      recurrence: `dp[${i}] = dp[${i - 1}] + dp[${i - 2}]`,
      explanation: `To fill dp[${i}] we only need the two cells behind it.`,
    });

    dp[i] = a + b;
    t.push({
      line: 7,
      variables: { i, n, "dp[i]": dp[i] },
      changes: [change("dp", [i], null, dp[i])],
      snapshots: snap(),
      pointers: { i: [i] },
      dependencies: [
        { structure: "dp", path: [i - 1] },
        { structure: "dp", path: [i - 2] },
      ],
      recurrence: `dp[${i}] = dp[${i - 1}] + dp[${i - 2}]\n      = ${a} + ${b}\n      = ${a + b}`,
      explanation: `dp[${i}] becomes ${a + b}.`,
    });
  }

  t.push({
    line: 10,
    variables: { n, result: dp[n] },
    changes: [],
    snapshots: snap(),
    pointers: { i: [n] },
    explanation: `The table is complete. fib(${n}) = ${dp[n]}.`,
  });

  return t.build();
}