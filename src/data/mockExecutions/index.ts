import type { ExecutionEvent } from "@/types/execution";
import { insertionSortTrace } from "./insertionSort";
import { binarySearchTrace } from "./binarySearch";
import { slidingWindowTrace } from "./slidingWindow";
import { kadaneTrace } from "./kadane";
import { fibonacciDPTrace } from "./fibonacciDP";
import { knapsackTrace } from "./knapsack";
import { lisTrace } from "./lis";
import { fibRecursionTrace } from "./fibRecursion";
import { bfsTrace } from "./bfs";
import { dfsTrace } from "./dfs";

/**
 * Execution engine mapping each algorithm slug and inputs to step-by-step ExecutionEvent[].
 */
const traceFactories: Record<string, (values?: unknown) => ExecutionEvent[]> = {
  "insertion-sort": (values) => insertionSortTrace(Array.isArray(values) ? (values as number[]) : [5, 2, 4, 1]),
  "binary-search": (values) => binarySearchTrace(Array.isArray(values) ? (values as number[]) : undefined, 11),
  "sliding-window": (values) => slidingWindowTrace(Array.isArray(values) ? (values as number[]) : undefined, 3),
  kadane: (values) => kadaneTrace(Array.isArray(values) ? (values as number[]) : undefined),
  "fibonacci-dp": () => fibonacciDPTrace(9),
  knapsack: (values) => knapsackTrace(Array.isArray(values) ? (values as number[]) : [1, 3, 4, 5], [1, 4, 5, 7], 5),
  lis: (values) => lisTrace(Array.isArray(values) ? (values as number[]) : undefined),
  "fib-recursion": () => fibRecursionTrace(5),
  bfs: () => bfsTrace([[1, 2], [0, 3, 4], [0], [1], [1]], 0),
  dfs: () => dfsTrace([[1, 2], [0, 3, 4], [0], [1], [1]], 0),
};

export function hasTrace(slug: string) {
  return slug in traceFactories;
}

export function runMockExecution(slug: string, values?: unknown): ExecutionEvent[] {
  const factory = traceFactories[slug];
  if (!factory) return [];
  return factory(values);
}

export {
  insertionSortTrace,
  binarySearchTrace,
  slidingWindowTrace,
  kadaneTrace,
  fibonacciDPTrace,
  knapsackTrace,
  lisTrace,
  fibRecursionTrace,
  bfsTrace,
  dfsTrace,
};