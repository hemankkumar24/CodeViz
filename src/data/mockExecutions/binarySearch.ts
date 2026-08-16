import type { ExecutionEvent } from "@/types/execution";
import { TraceBuilder } from "./helpers";

/** Binary search with low / mid / high pointers. */
export function binarySearchTrace(
  initial: number[] = [1, 3, 5, 7, 9, 11, 13, 15],
  target = 11,
): ExecutionEvent[] {
  const nums = [...initial];
  const t = new TraceBuilder();
  const snap = () => ({ nums: [...nums] });

  let low = 0;
  let high = nums.length - 1;

  t.push({
    line: 2,
    variables: { target, low, high },
    changes: [],
    snapshots: snap(),
    pointers: { low: [low], high: [high] },
    explanation: `Search the whole range for ${target}.`,
  });

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const value = nums[mid] as number;

    t.push({
      line: 5,
      variables: { target, low, high, mid },
      changes: [],
      snapshots: snap(),
      pointers: { low: [low], mid: [mid], high: [high] },
      highlighted: [{ structure: "nums", path: [mid] }],
      explanation: `mid = floor((${low} + ${high}) / 2) = ${mid}.`,
    });

    t.push({
      line: 7,
      variables: { target, low, high, mid, "nums[mid]": value },
      changes: [],
      snapshots: snap(),
      pointers: { low: [low], mid: [mid], high: [high] },
      highlighted: [{ structure: "nums", path: [mid] }],
      explanation: `Compare nums[${mid}] = ${value} with target ${target}.`,
    });

    if (value === target) {
      t.push({
        line: 8,
        variables: { target, low, high, mid, found: mid },
        changes: [],
        snapshots: snap(),
        pointers: { found: [mid] },
        highlighted: [{ structure: "nums", path: [mid] }],
        explanation: `Found ${target} at index ${mid}. Return.`,
      });
      return t.build();
    }

    if (value < target) {
      low = mid + 1;
      t.push({
        line: 10,
        variables: { target, low, high, mid },
        changes: [],
        snapshots: snap(),
        pointers: { low: [low], high: [high] },
        explanation: `${value} is too small — discard everything up to ${mid} and move low to ${low}.`,
      });
    } else {
      high = mid - 1;
      t.push({
        line: 12,
        variables: { target, low, high, mid },
        changes: [],
        snapshots: snap(),
        pointers: { low: [low], high: [Math.max(high, 0)] },
        explanation: `${value} is too large — pull high down to ${high}.`,
      });
    }
  }

  t.push({
    line: 15,
    variables: { target, low, high },
    changes: [],
    snapshots: snap(),
    pointers: {},
    explanation: "The range is empty — the target is not in the array.",
  });

  return t.build();
}