import type { ExecutionEvent } from "@/types/execution";
import { TraceBuilder } from "./helpers";

/** Max sum of a fixed-size window — array with left/right pointers. */
export function slidingWindowTrace(
  initial: number[] = [2, 1, 5, 1, 3, 2, 8],
  k = 3,
): ExecutionEvent[] {
  const nums = [...initial];
  const t = new TraceBuilder();
  const snap = () => ({ nums: [...nums] });

  let windowSum = 0;
  for (let i = 0; i < k; i++) {
    windowSum += nums[i] as number;
    t.push({
      line: 4,
      variables: { i, windowSum, k },
      changes: [],
      snapshots: snap(),
      pointers: { left: [0], right: [i] },
      highlighted: Array.from({ length: i + 1 }, (_, x) => ({
        structure: "nums",
        path: [x],
      })),
      explanation: `Fill the first window: add nums[${i}] = ${nums[i]} (sum ${windowSum}).`,
    });
  }

  let best = windowSum;
  t.push({
    line: 6,
    variables: { windowSum, best, k },
    changes: [],
    snapshots: snap(),
    pointers: { left: [0], right: [k - 1] },
    explanation: `First window of ${k} sums to ${best}.`,
  });

  for (let right = k; right < nums.length; right++) {
    const left = right - k;
    const prevSum = windowSum;
    windowSum += (nums[right] as number) - (nums[left] as number);

    t.push({
      line: 9,
      variables: { left: left + 1, right, windowSum, best },
      changes: [],
      snapshots: snap(),
      pointers: { left: [left + 1], right: [right] },
      highlighted: Array.from({ length: k }, (_, x) => ({
        structure: "nums",
        path: [left + 1 + x],
      })),
      explanation: `Slide right: ${prevSum} + ${nums[right]} - ${nums[left]} = ${windowSum}.`,
    });

    if (windowSum > best) {
      const prevBest = best;
      best = windowSum;
      t.push({
        line: 10,
        variables: { left: left + 1, right, windowSum, best },
        changes: [],
        snapshots: snap(),
        pointers: { left: [left + 1], right: [right] },
        explanation: `New best window sum: ${prevBest} → ${best}.`,
      });
    }
  }

  t.push({
    line: 13,
    variables: { best },
    changes: [],
    snapshots: snap(),
    pointers: {},
    explanation: `The heaviest window of ${k} sums to ${best}.`,
  });

  return t.build();
}