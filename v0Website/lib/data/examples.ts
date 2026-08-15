import type { ExecutionEvent, InputData, VisualizationType } from '@/lib/types/execution'
import {
  binarySearchCode,
  binarySearchTrace,
  fibRecursionCode,
  fibRecursionTrace,
  fibonacciDpCode,
  fibonacciDpTrace,
  insertionSortCode,
  insertionSortTrace,
  kadaneCode,
  kadaneTrace,
  knapsackCode,
  knapsackTrace,
} from './mock-executions'

export type Difficulty = 'Easy' | 'Medium' | 'Hard'

export type ExampleCategory =
  | 'Sorting'
  | 'Searching'
  | 'Arrays'
  | 'Sliding Window'
  | 'Two Pointers'
  | 'Dynamic Programming'
  | 'Recursion'
  | 'Graphs'
  | 'Trees'

export type Example = {
  slug: string
  title: string
  description: string
  category: ExampleCategory
  difficulty: Difficulty
  visualizationType: VisualizationType
  vizLabel: string
  code: string
  input: InputData | null
  selectedVariable: string | null
  events: ExecutionEvent[]
  /** for matrix/dp rendering */
  grid?: { rows: number; cols: number }
  /** preview kind for cards */
  preview: 'array' | 'dp' | 'matrix' | 'variables' | 'recursion' | 'graph'
  /** true = not shipped yet (roadmap) */
  comingSoon?: boolean
}

const knapsack = knapsackTrace()

const shipped: Example[] = [
  {
    slug: 'insertion-sort',
    title: 'Insertion Sort',
    description: 'Watch elements shift until each value reaches its correct position.',
    category: 'Sorting',
    difficulty: 'Easy',
    visualizationType: 'array',
    vizLabel: 'Array',
    code: insertionSortCode,
    input: { kind: 'array', values: [5, 2, 4, 1] },
    selectedVariable: 'nums',
    events: insertionSortTrace([5, 2, 4, 1]),
    preview: 'array',
  },
  {
    slug: 'binary-search',
    title: 'Binary Search',
    description: 'Halve the search window each step with low, mid, and high pointers.',
    category: 'Searching',
    difficulty: 'Easy',
    visualizationType: 'array',
    vizLabel: 'Array',
    code: binarySearchCode,
    input: { kind: 'array', values: [1, 3, 5, 7, 9, 11, 13] },
    selectedVariable: 'nums',
    events: binarySearchTrace([1, 3, 5, 7, 9, 11, 13], 9),
    preview: 'array',
  },
  {
    slug: 'sliding-window',
    title: 'Sliding Window (Max Sum)',
    description: 'Slide a fixed window across the array, tracking the running sum.',
    category: 'Sliding Window',
    difficulty: 'Medium',
    visualizationType: 'array',
    vizLabel: 'Array',
    code: kadaneCode,
    input: { kind: 'array', values: [-2, 1, -3, 4, -1, 2, 1, -5, 4] },
    selectedVariable: 'nums',
    events: kadaneTrace(),
    preview: 'array',
  },
  {
    slug: 'kadane',
    title: "Kadane's Algorithm",
    description: 'Track a current run and the best run seen so far as variables evolve.',
    category: 'Arrays',
    difficulty: 'Medium',
    visualizationType: 'array',
    vizLabel: 'Array + Variables',
    code: kadaneCode,
    input: { kind: 'array', values: [-2, 1, -3, 4, -1, 2, 1, -5, 4] },
    selectedVariable: 'nums',
    events: kadaneTrace(),
    preview: 'variables',
  },
  {
    slug: 'fibonacci-dp',
    title: 'Fibonacci (DP)',
    description: 'Fill a 1D table where each cell sums its two predecessors.',
    category: 'Dynamic Programming',
    difficulty: 'Easy',
    visualizationType: 'dp',
    vizLabel: 'DP Table',
    code: fibonacciDpCode,
    input: null,
    selectedVariable: 'dp',
    events: fibonacciDpTrace(7),
    grid: { rows: 1, cols: 8 },
    preview: 'dp',
  },
  {
    slug: 'knapsack',
    title: '0/1 Knapsack',
    description: 'Fill a 2D table, choosing at each cell whether to take an item.',
    category: 'Dynamic Programming',
    difficulty: 'Hard',
    visualizationType: 'dp',
    vizLabel: 'DP Table',
    code: knapsackCode,
    input: null,
    selectedVariable: 'dp',
    events: knapsack.events,
    grid: { rows: knapsack.rows, cols: knapsack.cols },
    preview: 'dp',
  },
  {
    slug: 'lis',
    title: 'Longest Increasing Subsequence',
    description: 'Build a DP array where each entry is the best run ending there.',
    category: 'Dynamic Programming',
    difficulty: 'Medium',
    visualizationType: 'dp',
    vizLabel: 'DP Table',
    code: fibonacciDpCode,
    input: null,
    selectedVariable: 'dp',
    events: fibonacciDpTrace(7),
    grid: { rows: 1, cols: 8 },
    preview: 'dp',
  },
  {
    slug: 'fibonacci-recursion',
    title: 'Fibonacci (Recursion)',
    description: 'Unfold the call tree and watch each frame resolve to a value.',
    category: 'Recursion',
    difficulty: 'Medium',
    visualizationType: 'recursion',
    vizLabel: 'Call Stack',
    code: fibRecursionCode,
    input: null,
    selectedVariable: 'fib',
    events: fibRecursionTrace(5),
    preview: 'recursion',
  },
]

const roadmap: Example[] = [
  {
    slug: 'bfs',
    title: 'Breadth-First Search',
    description: 'Explore a graph level by level using a queue.',
    category: 'Graphs',
    difficulty: 'Medium',
    visualizationType: 'auto',
    vizLabel: 'Graph',
    code: '// Graph visualizer coming soon',
    input: null,
    selectedVariable: null,
    events: [],
    preview: 'graph',
    comingSoon: true,
  },
  {
    slug: 'dfs',
    title: 'Depth-First Search',
    description: 'Dive deep along each branch before backtracking.',
    category: 'Graphs',
    difficulty: 'Medium',
    visualizationType: 'auto',
    vizLabel: 'Graph',
    code: '// Graph visualizer coming soon',
    input: null,
    selectedVariable: null,
    events: [],
    preview: 'graph',
    comingSoon: true,
  },
]

export const examples: Example[] = [...shipped, ...roadmap]

export const exampleCategories: ExampleCategory[] = [
  'Sorting',
  'Searching',
  'Arrays',
  'Sliding Window',
  'Two Pointers',
  'Dynamic Programming',
  'Recursion',
  'Graphs',
  'Trees',
]

export function getExample(slug: string | null | undefined): Example | undefined {
  if (!slug) return undefined
  return examples.find((e) => e.slug === slug)
}
