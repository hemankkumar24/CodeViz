import type { ExecutionEvent, StateChange, VisualizationType } from '@/types/execution'

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

export function insertionSortTrace(initial: number[] = [5, 2, 4, 1]): ExecutionEvent[] {
  const r = new Recorder()
  const nums: number[] = [...initial]
  for (let i = 1; i < nums.length; i++) {
    const key = nums[i]!
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
    while (j >= 0 && (nums[j] as number) > key) {
      r.push({
        line: 5,
        variables: { i, key, j },
        changes: [],
        highlighted: [{ structure: 'nums', path: [j] }],
        pointers: { i: [i], j: [j] },
        explanation: `nums[${j}] (${nums[j]}) > key (${key}) — shift right.`,
      })
      const prev = nums[j + 1]
      nums[j + 1] = nums[j]!
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
      highlighted: j >= 0 ? [{ structure: 'nums', path: [j] }] : [],
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

export type LandingDeriveOptions = {
  type: VisualizationType
  targetStructure: string
  initialArray?: number[]
}

const INF = '∞'
const toNum = (v: unknown): number => (v === INF || v === Infinity ? Infinity : Number(v))

export function deriveLandingVisualizationState(
  events: ExecutionEvent[],
  currentStep: number,
  opts: LandingDeriveOptions,
) {
  const clamped = Math.max(0, Math.min(currentStep, events.length - 1))
  const event = events[clamped]
  const empty = {
    currentArray: opts.initialArray ?? [],
    highlightedCells: [] as number[][],
    changedCells: [] as number[][],
    changeTypes: {} as Record<string, 'update' | 'insert' | 'delete'>,
    comparing: [] as number[][],
    pointers: {} as Record<string, number[]>,
    variables: {} as Record<string, unknown>,
    explanation: '',
    line: 1,
  }
  if (!event) return empty

  const { targetStructure } = opts
  let currentArray: number[] | undefined

  if (opts.initialArray) {
    const arr = [...opts.initialArray]
    for (let s = 0; s <= clamped; s++) {
      const stepEvent = events[s]
      if (stepEvent) {
        for (const c of stepEvent.changes) {
          if (c.structure === targetStructure && c.path.length === 1 && c.path[0] !== undefined) {
            arr[c.path[0]] = toNum(c.nextValue)
          }
        }
      }
    }
    currentArray = arr
  }

  const changedCells: number[][] = []
  const changeTypes: Record<string, 'update' | 'insert' | 'delete'> = {}
  for (const c of event.changes) {
    if (c.structure === targetStructure) {
      changedCells.push(c.path)
      changeTypes[c.path.join(',')] = c.type
    }
  }

  const comparing = (event.highlighted ?? [])
    .filter((h) => h.structure === targetStructure)
    .map((h) => h.path)

  return {
    currentArray,
    highlightedCells: comparing,
    changedCells,
    changeTypes,
    comparing,
    pointers: event.pointers ?? {},
    variables: event.variables ?? {},
    explanation: event.explanation ?? '',
    line: event.line,
  }
}

export function mutationSteps(events: ExecutionEvent[]): number[] {
  return events.filter((e) => e.changes.length > 0).map((e) => e.step)
}
