import type { ExecutionEvent } from "@/types/execution";
import { TraceBuilder, change } from "./helpers";

/**
 * Insertion sort over [5, 2, 4, 1] — the canonical trace.
 * Line numbers refer to `examples/insertion-sort` source.
 */
export function insertionSortTrace(initial: number[] = [5, 2, 4, 1]): ExecutionEvent[] {
  const nums = [...initial];
  const t = new TraceBuilder();

  const snap = () => ({ nums: [...nums] });

  t.push({
    line: 2,
    variables: { i: 1, "nums.length": nums.length },
    changes: [],
    snapshots: snap(),
    pointers: { i: [1] },
    explanation: "Start the outer pass. Everything left of i is already sorted.",
  });

  for (let i = 1; i < nums.length; i++) {
    const key = nums[i] as number;
    let j = i - 1;

    t.push({
      line: 3,
      variables: { i, key, j: j },
      changes: [],
      snapshots: snap(),
      pointers: { i: [i] },
      highlighted: [{ structure: "nums", path: [i] }],
      explanation: `Hold nums[${i}] as key = ${key}. This slot is now free to overwrite.`,
    });

    t.push({
      line: 4,
      variables: { i, key, j },
      changes: [],
      snapshots: snap(),
      pointers: { i: [i], j: [j] },
      explanation: `j starts at ${j}, the last sorted position.`,
    });

    while (j >= 0 && (nums[j] as number) > key) {
      t.push({
        line: 6,
        variables: { i, key, j, "nums[j]": nums[j] },
        changes: [],
        snapshots: snap(),
        pointers: { i: [i], j: [j] },
        highlighted: [{ structure: "nums", path: [j] }],
        explanation: `Compare nums[${j}] = ${nums[j]} against key = ${key}. It is larger, so it must shift right.`,
      });

      const prev = nums[j + 1] as number;
      nums[j + 1] = nums[j] as number;
      t.push({
        line: 7,
        variables: { i, key, j },
        changes: [change("nums", [j + 1], prev, nums[j + 1])],
        snapshots: snap(),
        pointers: { i: [i], j: [j] },
        explanation: "nums[j + 1] = nums[j]",
      });

      j--;
      t.push({
        line: 8,
        variables: { i, key, j },
        changes: [],
        snapshots: snap(),
        pointers: { i: [i], j: [Math.max(j, 0)] },
        explanation: `Move j left to ${j}.`,
      });
    }

    t.push({
      line: 6,
      variables: { i, key, j },
      changes: [],
      snapshots: snap(),
      pointers: { i: [i], j: [Math.max(j, 0)] },
      explanation:
        j < 0
          ? "j fell off the left edge — key belongs at the front."
          : `nums[${j}] = ${nums[j]} is not greater than key, so the shifting stops.`,
    });

    const prevAtSlot = nums[j + 1] as number;
    nums[j + 1] = key;
    t.push({
      line: 11,
      variables: { i, key, j },
      changes: [change("nums", [j + 1], prevAtSlot, key)],
      snapshots: snap(),
      pointers: { i: [i], j: [Math.max(j, 0)], key: [j + 1] },
      explanation: "nums[j + 1] = key",
    });

    if (i + 1 < nums.length) {
      t.push({
        line: 2,
        variables: { i: i + 1, key, j },
        changes: [],
        snapshots: snap(),
        pointers: { i: [i + 1] },
        explanation: `Sorted prefix is now length ${i + 1}. Advance i.`,
      });
    }
  }

  t.push({
    line: 13,
    variables: { i: nums.length },
    changes: [],
    snapshots: snap(),
    pointers: {},
    explanation: "Every element has reached its correct position. Return the sorted array.",
  });

  return t.build();
}