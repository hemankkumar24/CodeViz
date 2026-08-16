import type { ExecutionEvent } from "@/types/execution";
import { insertionSortTrace } from "./insertionSort";
import { binarySearchTrace } from "./binarySearch";
import { slidingWindowTrace } from "./slidingWindow";
import { kadaneTrace } from "./kadane";
import { fibonacciDPTrace } from "./fibonacciDP";
import { knapsackTrace } from "./knapsack";
import { lisTrace } from "./lis";
import { fibRecursionTrace } from "./fibRecursion";

/**
 * Stand-in for the future execution engine. Same signature shape a real
 * backend would expose: give it a slug + input, get ExecutionEvent[] back.
 */
const traceFactories: Record<string, (values?: number[]) => ExecutionEvent[]> = {
  "insertion-sort": (values) => insertionSortTrace(values ?? [5, 2, 4, 1]),
  "binary-search": (values) => binarySearchTrace(values, 11),
  "sliding-window": (values) => slidingWindowTrace(values, 3),
  kadane: (values) => kadaneTrace(values),
  "fibonacci-dp": () => fibonacciDPTrace(9),
  knapsack: (values) => knapsackTrace(values ?? [1, 3, 4, 5], [1, 4, 5, 7], 5),
  lis: (values) => lisTrace(values),
  "fib-recursion": () => fibRecursionTrace(5),
};

export function hasTrace(slug: string) {
  return slug in traceFactories;
}

export function runMockExecution(slug: string, values?: number[]): ExecutionEvent[] {
  const factory = traceFactories[slug];
  if (!factory) return [];
  const usable = values && values.length > 0 ? values : undefined;
  return factory(usable);
}

export { insertionSortTrace };