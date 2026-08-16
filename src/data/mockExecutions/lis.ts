import type { ExecutionEvent } from "@/types/execution";
import { TraceBuilder, change } from "./helpers";

/** Longest increasing subsequence — 1D DP with dependency links. */
export function lisTrace(initial: number[] = [10, 9, 2, 5, 3, 7, 101]): ExecutionEvent[] {
  const nums = [...initial];
  const t = new TraceBuilder();
  const dp = nums.map(() => 1);
  const snap = () => ({ dp: [...dp], nums: [...nums] });

  t.push({
    line: 2,
    variables: { n: nums.length },
    changes: [],
    snapshots: snap(),
    pointers: {},
    explanation: "Every element alone is an increasing subsequence of length 1.",
  });

  for (let i = 1; i < nums.length; i++) {
    for (let j = 0; j < i; j++) {
      const grows = (nums[j] as number) < (nums[i] as number);
      t.push({
        line: 6,
        variables: { i, j, "nums[i]": nums[i], "nums[j]": nums[j] },
        changes: [],
        snapshots: snap(),
        pointers: { i: [i], j: [j] },
        dependencies: [{ structure: "dp", path: [j] }],
        recurrence: `nums[${j}] < nums[${i}] ? ${grows}`,
        explanation: grows
          ? `nums[${j}] = ${nums[j]} is smaller, so dp[${j}] can be extended.`
          : `nums[${j}] = ${nums[j]} is not smaller — skip it.`,
      });

      if (grows && (dp[j] as number) + 1 > (dp[i] as number)) {
        const prev = dp[i] as number;
        dp[i] = (dp[j] as number) + 1;
        t.push({
          line: 7,
          variables: { i, j, "dp[i]": dp[i] },
          changes: [change("dp", [i], prev, dp[i])],
          snapshots: snap(),
          pointers: { i: [i], j: [j] },
          dependencies: [{ structure: "dp", path: [j] }],
          recurrence: `dp[${i}] = dp[${j}] + 1 = ${dp[i]}`,
          explanation: `dp[${i}] grows from ${prev} to ${dp[i]}.`,
        });
      }
    }
  }

  const best = Math.max(...dp);
  t.push({
    line: 11,
    variables: { longest: best },
    changes: [],
    snapshots: snap(),
    pointers: { best: [dp.indexOf(best)] },
    explanation: `The largest dp value is ${best} — that is the longest increasing subsequence.`,
  });

  return t.build();
}