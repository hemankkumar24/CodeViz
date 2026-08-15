import type { CallFrame, ExecutionEvent, StateChange } from '@/lib/types/execution'

// ------------------------------------------------------------------
// Authored mock traces. Each generator runs the algorithm once and
// records ExecutionEvent[] in the exact contract shape (spec §12).
// These are the "hand-authored" traces that a real engine will replace.
// ------------------------------------------------------------------

class Recorder {
  events: ExecutionEvent[] = []
  private step = 0
  push(e: Omit<ExecutionEvent, 'step'>) {
    this.events.push({ step: this.step++, ...e })
  }
}

const chg = (
  structure: string,
  path: number[],
  previousValue: unknown,
  nextValue: unknown,
  type: StateChange['type'] = 'update',
): StateChange => ({ structure, path, previousValue, nextValue, type })

// ----- 1. Insertion Sort ------------------------------------------

export function insertionSortTrace(initial = [5, 2, 4, 1]): ExecutionEvent[] {
  const r = new Recorder()
  const nums = [...initial]
  const p = (i: number, j: number, key: number | null) => ({
    i: [i],
    j: [j],
    ...(key !== null ? { key: [] as number[] } : {}),
  })
  for (let i = 1; i < nums.length; i++) {
    const key = nums[i]
    r.push({
      line: 3,
      variables: { i, key, j: i - 1 },
      changes: [],
      pointers: { i: [i] },
      explanation: `Take key = nums[${i}] = ${key} to insert into the sorted left portion.`,
    })
    let j = i - 1
    r.push({
      line: 4,
      variables: { i, key, j },
      changes: [],
      pointers: { i: [i], j: [j] },
      explanation: `Start comparing from j = ${j}.`,
    })
    while (j >= 0 && nums[j] > key) {
      r.push({
        line: 5,
        variables: { i, key, j },
        changes: [],
        comparing: [[j]],
        pointers: { i: [i], j: [j] },
        explanation: `nums[${j}] (${nums[j]}) > key (${key}) — shift right.`,
      })
      const prev = nums[j + 1]
      nums[j + 1] = nums[j]
      r.push({
        line: 6,
        variables: { i, key, j },
        changes: [chg('nums', [j + 1], prev, nums[j + 1])],
        pointers: { i: [i], j: [j] },
        explanation: `nums[${j + 1}] = nums[${j}] — copy ${nums[j]} one slot right.`,
      })
      j--
      r.push({
        line: 7,
        variables: { i, key, j },
        changes: [],
        pointers: { i: [i], j: [j] },
        explanation: `Decrement j to ${j}.`,
      })
    }
    r.push({
      line: 5,
      variables: { i, key, j },
      changes: [],
      comparing: j >= 0 ? [[j]] : [],
      pointers: { i: [i], j: [j] },
      explanation:
        j < 0
          ? `Reached the start of the array — insert here.`
          : `nums[${j}] (${nums[j]}) ≤ key (${key}) — found the slot.`,
    })
    const prevSlot = nums[j + 1]
    nums[j + 1] = key
    r.push({
      line: 9,
      variables: { i, key, j },
      changes: [chg('nums', [j + 1], prevSlot, key)],
      pointers: { i: [i], j: [j] },
      explanation: `nums[${j + 1}] = key — drop ${key} into its sorted position.`,
    })
  }
  r.push({
    line: 11,
    variables: {},
    changes: [],
    explanation: `Array fully sorted.`,
  })
  return r.events
}

export const insertionSortCode = `function insertionSort(nums) {
  for (let i = 1; i < nums.length; i++) {
    let key = nums[i];
    let j = i - 1;
    while (j >= 0 && nums[j] > key) {
      nums[j + 1] = nums[j];
      j--;
    }
    nums[j + 1] = key;
  }
  return nums;
}`

// ----- 2. Binary Search -------------------------------------------

export function binarySearchTrace(
  initial = [1, 3, 5, 7, 9, 11, 13],
  target = 9,
): ExecutionEvent[] {
  const r = new Recorder()
  const nums = [...initial]
  let low = 0
  let high = nums.length - 1
  r.push({
    line: 2,
    variables: { low, high, target },
    changes: [],
    pointers: { low: [low], high: [high] },
    explanation: `Search window covers the whole array.`,
  })
  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    r.push({
      line: 4,
      variables: { low, high, mid, target },
      changes: [],
      pointers: { low: [low], mid: [mid], high: [high] },
      comparing: [[mid]],
      explanation: `mid = ⌊(${low}+${high})/2⌋ = ${mid}, nums[mid] = ${nums[mid]}.`,
    })
    if (nums[mid] === target) {
      r.push({
        line: 5,
        variables: { low, high, mid, target },
        changes: [],
        pointers: { low: [low], mid: [mid], high: [high] },
        comparing: [[mid]],
        explanation: `nums[${mid}] === target (${target}) — found it.`,
      })
      return r.events
    }
    if (nums[mid] < target) {
      low = mid + 1
      r.push({
        line: 7,
        variables: { low, high, mid, target },
        changes: [],
        pointers: { low: [low], mid: [mid], high: [high] },
        explanation: `nums[${mid}] < target — discard left half, low = ${low}.`,
      })
    } else {
      high = mid - 1
      r.push({
        line: 9,
        variables: { low, high, mid, target },
        changes: [],
        pointers: { low: [low], mid: [mid], high: [high] },
        explanation: `nums[${mid}] > target — discard right half, high = ${high}.`,
      })
    }
  }
  r.push({ line: 12, variables: { low, high }, changes: [], explanation: `Target not found.` })
  return r.events
}

export const binarySearchCode = `function binarySearch(nums, target) {
  let low = 0, high = nums.length - 1;
  while (low <= high) {
    let mid = Math.floor((low + high) / 2);
    if (nums[mid] === target) {
      return mid;
    } else if (nums[mid] < target) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return -1;
}`

// ----- 3. Fibonacci DP (1D table) ---------------------------------

export function fibonacciDpTrace(n = 7): ExecutionEvent[] {
  const r = new Recorder()
  const dp = new Array(n + 1).fill(Number.POSITIVE_INFINITY)
  dp[0] = 0
  r.push({
    line: 3,
    variables: { n },
    changes: [chg('dp', [0], '∞', 0)],
    explanation: `Base case dp[0] = 0.`,
  })
  dp[1] = 1
  r.push({
    line: 4,
    variables: { n },
    changes: [chg('dp', [1], '∞', 1)],
    explanation: `Base case dp[1] = 1.`,
  })
  for (let i = 2; i <= n; i++) {
    r.push({
      line: 6,
      variables: { i, n },
      changes: [],
      dependencies: [[i - 1], [i - 2]],
      recurrence: `dp[${i}] = dp[${i - 1}] + dp[${i - 2}]`,
      pointers: { i: [i] },
      explanation: `Compute dp[${i}] from its two predecessors.`,
    })
    const prev = dp[i]
    dp[i] = dp[i - 1] + dp[i - 2]
    r.push({
      line: 7,
      variables: { i, n },
      changes: [chg('dp', [i], prev === Infinity ? '∞' : prev, dp[i])],
      dependencies: [[i - 1], [i - 2]],
      recurrence: `dp[${i}] = dp[${i - 1}] + dp[${i - 2}]\n     = ${dp[i - 1]} + ${dp[i - 2]}\n     = ${dp[i]}`,
      pointers: { i: [i] },
      explanation: `dp[${i}] = ${dp[i - 1]} + ${dp[i - 2]} = ${dp[i]}.`,
    })
  }
  r.push({ line: 9, variables: { n }, changes: [], explanation: `dp[${n}] = ${dp[n]} is the answer.` })
  return r.events
}

export const fibonacciDpCode = `function fib(n) {
  const dp = new Array(n + 1).fill(Infinity);
  dp[0] = 0;
  dp[1] = 1;
  for (let i = 2; i <= n; i++) {
    // dp[i] depends on the two before it
    dp[i] = dp[i - 1] + dp[i - 2];
  }
  return dp[n];
}`

// ----- 4. 0/1 Knapsack (2D DP) ------------------------------------

export function knapsackTrace(): { events: ExecutionEvent[]; rows: number; cols: number } {
  const r = new Recorder()
  const weights = [0, 1, 3, 4] // 1-indexed items
  const values = [0, 15, 20, 30]
  const W = 4
  const n = 3
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(W + 1).fill(0))
  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= W; w++) {
      const without = dp[i - 1][w]
      if (weights[i] <= w) {
        const withItem = dp[i - 1][w - weights[i]] + values[i]
        const deps: number[][] = [
          [i - 1, w],
          [i - 1, w - weights[i]],
        ]
        r.push({
          line: 8,
          variables: { i, w, weight: weights[i], value: values[i] },
          changes: [],
          dependencies: deps,
          recurrence: `dp[${i}][${w}] = max(\n    dp[${i - 1}][${w}],\n    dp[${i - 1}][${w - weights[i]}] + ${values[i]}\n)`,
          pointers: {},
          explanation: `Item ${i} fits (weight ${weights[i]} ≤ ${w}). Compare taking vs. skipping.`,
        })
        const best = Math.max(without, withItem)
        const prev = dp[i][w]
        dp[i][w] = best
        r.push({
          line: 9,
          variables: { i, w },
          changes: [chg('dp', [i, w], prev, best)],
          dependencies: deps,
          recurrence: `dp[${i}][${w}] = max(${without}, ${withItem}) = ${best}`,
          explanation: `dp[${i}][${w}] = ${best} (${best === withItem ? 'took' : 'skipped'} item ${i}).`,
        })
      } else {
        const deps: number[][] = [[i - 1, w]]
        const prev = dp[i][w]
        dp[i][w] = without
        r.push({
          line: 11,
          variables: { i, w, weight: weights[i] },
          changes: [chg('dp', [i, w], prev, without)],
          dependencies: deps,
          recurrence: `dp[${i}][${w}] = dp[${i - 1}][${w}] = ${without}`,
          explanation: `Item ${i} too heavy for capacity ${w} — inherit ${without} from above.`,
        })
      }
    }
  }
  r.push({
    line: 15,
    variables: {},
    changes: [],
    explanation: `Best value = dp[${n}][${W}] = ${dp[n][W]}.`,
  })
  return { events: r.events, rows: n + 1, cols: W + 1 }
}

export const knapsackCode = `function knapsack(weights, values, W) {
  const n = weights.length;
  const dp = Array.from({ length: n + 1 },
    () => new Array(W + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= W; w++) {
      if (weights[i] <= w) {
        dp[i][w] = Math.max(
          dp[i - 1][w],
          dp[i - 1][w - weights[i]] + values[i]
        );
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }
  return dp[n][W];
}`

// ----- 5. Kadane's Algorithm --------------------------------------

export function kadaneTrace(initial = [-2, 1, -3, 4, -1, 2, 1, -5, 4]): ExecutionEvent[] {
  const r = new Recorder()
  const nums = [...initial]
  let currentSum = nums[0]
  let maxSum = nums[0]
  r.push({
    line: 2,
    variables: { currentSum, maxSum, i: 0 },
    changes: [],
    pointers: { i: [0] },
    explanation: `Seed currentSum and maxSum with nums[0] = ${nums[0]}.`,
  })
  for (let i = 1; i < nums.length; i++) {
    const prevCurrent = currentSum
    currentSum = Math.max(nums[i], currentSum + nums[i])
    const extended = currentSum === prevCurrent + nums[i]
    r.push({
      line: 4,
      variables: { currentSum, maxSum, i },
      changes: [],
      comparing: [[i]],
      pointers: { i: [i] },
      explanation: extended
        ? `Extend subarray: currentSum = ${prevCurrent} + ${nums[i]} = ${currentSum}.`
        : `Restart at nums[${i}] = ${nums[i]} (bigger than ${prevCurrent + nums[i]}).`,
    })
    if (currentSum > maxSum) {
      const prevMax = maxSum
      maxSum = currentSum
      r.push({
        line: 5,
        variables: { currentSum, maxSum, i },
        changes: [],
        pointers: { i: [i] },
        explanation: `New best: maxSum ${prevMax} → ${maxSum}.`,
      })
    } else {
      r.push({
        line: 4,
        variables: { currentSum, maxSum, i },
        changes: [],
        pointers: { i: [i] },
        explanation: `maxSum stays ${maxSum}.`,
      })
    }
  }
  r.push({ line: 8, variables: { maxSum }, changes: [], explanation: `Maximum subarray sum = ${maxSum}.` })
  return r.events
}

export const kadaneCode = `function kadane(nums) {
  let currentSum = nums[0], maxSum = nums[0];
  for (let i = 1; i < nums.length; i++) {
    currentSum = Math.max(nums[i], currentSum + nums[i]);
    maxSum = Math.max(maxSum, currentSum);
  }
  return maxSum;
}`

// ----- 6. Fibonacci recursion (call stack) ------------------------

export function fibRecursionTrace(n = 5): ExecutionEvent[] {
  const r = new Recorder()
  const frames: CallFrame[] = []
  let counter = 0

  const snapshot = (): CallFrame[] => frames.map((f) => ({ ...f }))

  function fib(value: number, parentId: string | null, line: number): number {
    const id = `f${counter++}`
    frames.push({ id, label: `fib(${value})`, parentId, status: 'active' })
    r.push({
      line: value <= 1 ? 2 : 4,
      variables: { n: value },
      changes: [],
      callstack: snapshot(),
      explanation: `Call fib(${value}).`,
    })
    let result: number
    if (value <= 1) {
      result = value
    } else {
      const a = fib(value - 1, id, 4)
      const b = fib(value - 2, id, 4)
      result = a + b
    }
    const frame = frames.find((f) => f.id === id)!
    frame.status = 'returned'
    frame.returnValue = result
    r.push({
      line: value <= 1 ? 2 : 5,
      variables: { n: value },
      changes: [],
      callstack: snapshot(),
      explanation: `fib(${value}) returns ${result}.`,
    })
    return result
  }

  fib(n, null, 4)
  return r.events
}

export const fibRecursionCode = `function fib(n) {
  if (n <= 1) {
    return n;
  }
  return fib(n - 1)
       + fib(n - 2);
}`
