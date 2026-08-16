import type { ExecutionEvent } from "@/types/execution";
import { TraceBuilder } from "./helpers";

/** Kadane's algorithm — array plus the two variables that matter. */
export function kadaneTrace(
  initial: number[] = [-2, 1, -3, 4, -1, 2, 1, -5, 4],
): ExecutionEvent[] {
  const nums = [...initial];
  const t = new TraceBuilder();
  const snap = () => ({ nums: [...nums] });

  let currentSum = nums[0] as number;
  let maxSum = nums[0] as number;

  t.push({
    line: 2,
    variables: { currentSum, maxSum, i: 0 },
    changes: [],
    snapshots: snap(),
    pointers: { i: [0] },
    highlighted: [{ structure: "nums", path: [0] }],
    explanation: "Seed both sums with the first element.",
  });

  for (let i = 1; i < nums.length; i++) {
    const v = nums[i] as number;
    const extended = currentSum + v;
    const restart = v;

    t.push({
      line: 5,
      variables: { i, "nums[i]": v, currentSum, maxSum },
      changes: [],
      snapshots: snap(),
      pointers: { i: [i] },
      highlighted: [{ structure: "nums", path: [i] }],
      explanation: `Extend the run (${currentSum} + ${v} = ${extended}) or restart at ${restart}?`,
    });

    const prevCurrent = currentSum;
    currentSum = Math.max(restart, extended);
    t.push({
      line: 6,
      variables: { i, currentSum, maxSum },
      changes: [],
      snapshots: snap(),
      pointers: { i: [i] },
      highlighted: [{ structure: "nums", path: [i] }],
      explanation:
        currentSum === restart && restart !== extended
          ? `The old run (${prevCurrent}) was dragging us down — restart at ${restart}.`
          : `Keep extending: currentSum = ${currentSum}.`,
    });

    if (currentSum > maxSum) {
      const prevMax = maxSum;
      maxSum = currentSum;
      t.push({
        line: 7,
        variables: { i, currentSum, maxSum },
        changes: [],
        snapshots: snap(),
        pointers: { i: [i], best: [i] },
        highlighted: [{ structure: "nums", path: [i] }],
        explanation: `New best subarray sum: ${prevMax} → ${maxSum}.`,
      });
    }
  }

  t.push({
    line: 10,
    variables: { currentSum, maxSum },
    changes: [],
    snapshots: snap(),
    pointers: {},
    explanation: `Largest contiguous sum is ${maxSum}.`,
  });

  return t.build();
}