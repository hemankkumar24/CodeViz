import type { InputData, VisualizationType } from "@/types/execution";

export type ExampleCategory =
  | "Sorting"
  | "Searching"
  | "Arrays"
  | "Sliding Window"
  | "Two Pointers"
  | "Dynamic Programming"
  | "Recursion"
  | "Graphs"
  | "Trees";

export type Difficulty = "Easy" | "Medium" | "Hard";

export type Example = {
  slug: string;
  title: string;
  description: string;
  categories: ExampleCategory[];
  difficulty: Difficulty;
  visualizationType: VisualizationType;
  visualizationLabel: string;
  targetVariable: string | null;
  code: string;
  input: InputData;
  /** Whether an authored trace exists for this example yet. */
  traced: boolean;
  previewKind: "array" | "grid" | "graph" | "tree" | "variables";
};

export const examples: Example[] = [
  {
    slug: "insertion-sort",
    title: "Insertion Sort",
    description: "Watch elements shift until each value reaches its correct position.",
    categories: ["Sorting", "Arrays"],
    difficulty: "Easy",
    visualizationType: "array",
    visualizationLabel: "Array",
    targetVariable: "nums",
    traced: true,
    previewKind: "array",
    code: `function insertionSort(nums) {
  for (let i = 1; i < nums.length; i++) {
    const key = nums[i];
    let j = i - 1;

    while (j >= 0 && nums[j] > key) {
      nums[j + 1] = nums[j];
      j--;
    }

    nums[j + 1] = key;
  }
  return nums;
}`,
    input: { kind: "array", values: [5, 2, 4, 1] },
  },
  {
    slug: "binary-search",
    title: "Binary Search",
    description: "Halve the search range until the target is cornered.",
    categories: ["Searching", "Arrays", "Two Pointers"],
    difficulty: "Easy",
    visualizationType: "array",
    visualizationLabel: "Array",
    targetVariable: "nums",
    traced: true,
    previewKind: "array",
    code: `function binarySearch(nums, target) {
  let low = 0, high = nums.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);

    if (nums[mid] === target) {
      return mid;
    } else if (nums[mid] < target) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return -1;
}`,
    input: { kind: "array", values: [1, 3, 5, 7, 9, 11, 13, 15] },
  },
  {
    slug: "sliding-window",
    title: "Sliding Window",
    description: "Move a fixed window across the array and track its running sum.",
    categories: ["Sliding Window", "Arrays"],
    difficulty: "Easy",
    visualizationType: "array",
    visualizationLabel: "Array",
    targetVariable: "nums",
    traced: true,
    previewKind: "array",
    code: `function maxWindowSum(nums, k) {
  let windowSum = 0;

  for (let i = 0; i < k; i++) windowSum += nums[i];

  let best = windowSum;

  for (let right = k; right < nums.length; right++) {
    windowSum += nums[right] - nums[right - k];
    if (windowSum > best) best = windowSum;
  }

  return best;
}`,
    input: { kind: "array", values: [2, 1, 5, 1, 3, 2, 8] },
  },
  {
    slug: "kadane",
    title: "Kadane's Algorithm",
    description: "Decide at every element whether to extend the run or start over.",
    categories: ["Arrays", "Dynamic Programming"],
    difficulty: "Medium",
    visualizationType: "array",
    visualizationLabel: "Array + Variables",
    targetVariable: "nums",
    traced: true,
    previewKind: "variables",
    code: `function maxSubArray(nums) {
  let currentSum = nums[0], maxSum = nums[0];

  for (let i = 1; i < nums.length; i++) {
    const value = nums[i];
    currentSum = Math.max(value, currentSum + value);
    maxSum = Math.max(maxSum, currentSum);
  }

  return maxSum;
}`,
    input: { kind: "array", values: [-2, 1, -3, 4, -1, 2, 1, -5, 4] },
  },
  {
    slug: "fibonacci-dp",
    title: "Fibonacci DP",
    description: "Fill a table left to right, each cell built from the two behind it.",
    categories: ["Dynamic Programming"],
    difficulty: "Easy",
    visualizationType: "dp",
    visualizationLabel: "DP Table",
    targetVariable: "dp",
    traced: true,
    previewKind: "grid",
    code: `function fib(n) {
  const dp = new Array(n + 1);
  dp[0] = 0;
  dp[1] = 1;

  for (let i = 2; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2];
  }

  return dp[n];
}`,
    input: { kind: "variables", values: { n: 9 } },
  },
  {
    slug: "knapsack",
    title: "0/1 Knapsack",
    description: "Every cell asks one question: take this item, or leave it?",
    categories: ["Dynamic Programming"],
    difficulty: "Hard",
    visualizationType: "dp",
    visualizationLabel: "DP Table (2D)",
    targetVariable: "dp",
    traced: true,
    previewKind: "grid",
    code: `function knapsack(weights, values, capacity) {
  const n = weights.length;
  const dp = zeros(n + 1, capacity + 1);

  for (let i = 1; i <= n; i++) {
    for (let c = 0; c <= capacity; c++) {
      if (weights[i - 1] > c) {
        dp[i][c] = dp[i - 1][c];
      } else {
        dp[i][c] = Math.max(
          dp[i - 1][c],
          dp[i - 1][c - weights[i - 1]] + values[i - 1]
        );
      }
    }
  }

  return dp[n][capacity];
}`,
    input: { kind: "array", values: [1, 3, 4, 5] },
  },
  {
    slug: "lis",
    title: "Longest Increasing Subsequence",
    description: "Each dp cell reaches back for the best chain it can extend.",
    categories: ["Dynamic Programming", "Arrays"],
    difficulty: "Medium",
    visualizationType: "dp",
    visualizationLabel: "DP Table",
    targetVariable: "dp",
    traced: true,
    previewKind: "grid",
    code: `function lengthOfLIS(nums) {
  const dp = nums.map(() => 1);

  for (let i = 1; i < nums.length; i++) {
    for (let j = 0; j < i; j++) {
      if (nums[j] < nums[i]) {
        dp[i] = Math.max(dp[i], dp[j] + 1);
      }
    }
  }

  return Math.max(...dp);
}`,
    input: { kind: "array", values: [10, 9, 2, 5, 3, 7, 101] },
  },
  {
    slug: "fib-recursion",
    title: "Recursive Fibonacci",
    description: "See the call tree expand, then collapse as values return.",
    categories: ["Recursion"],
    difficulty: "Medium",
    visualizationType: "recursion",
    visualizationLabel: "Call Stack",
    targetVariable: "fib",
    traced: true,
    previewKind: "tree",
    code: `function fib(n) {
  if (n <= 1) return n;

  return fib(n - 1) + fib(n - 2);
}`,
    input: { kind: "variables", values: { n: 5 } },
  },
  {
    slug: "bfs",
    title: "Breadth-First Search",
    description: "Explore a graph level by level using a queue.",
    categories: ["Graphs", "Trees"],
    difficulty: "Medium",
    visualizationType: "auto",
    visualizationLabel: "Graph (soon)",
    targetVariable: null,
    traced: false,
    previewKind: "graph",
    code: `function bfs(graph, start) {
  const queue = [start];
  const seen = new Set([start]);

  while (queue.length) {
    const node = queue.shift();
    for (const next of graph[node]) {
      if (!seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return [...seen];
}`,
    input: { kind: "array", values: [0, 1, 2, 3, 4] },
  },
  {
    slug: "dfs",
    title: "Depth-First Search",
    description: "Follow one path as deep as it goes before backtracking.",
    categories: ["Graphs", "Recursion", "Trees"],
    difficulty: "Medium",
    visualizationType: "auto",
    visualizationLabel: "Graph (soon)",
    targetVariable: null,
    traced: false,
    previewKind: "graph",
    code: `function dfs(graph, node, seen = new Set()) {
  seen.add(node);

  for (const next of graph[node]) {
    if (!seen.has(next)) dfs(graph, next, seen);
  }

  return [...seen];
}`,
    input: { kind: "array", values: [0, 1, 2, 3, 4] },
  },
];

export const allCategories: ExampleCategory[] = [
  "Sorting",
  "Searching",
  "Arrays",
  "Sliding Window",
  "Two Pointers",
  "Dynamic Programming",
  "Recursion",
  "Graphs",
  "Trees",
];

export function getExample(slug: string | undefined | null): Example | undefined {
  if (!slug) return undefined;
  return examples.find((e) => e.slug === slug);
}