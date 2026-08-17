/**
 * Scope chain for the step-by-step interpreter.
 *
 * This file provides:
 * 1. Array/Map/Set/String prototype polyfills for C++/Java container compatibility
 * 2. CppIterator — sentinel objects for .begin()/.end() so reverse()/sort()/fill() work
 * 3. Data structure classes: ListNode, TreeNode, PriorityQueue, StringBuilder, UnorderedMap
 * 4. BUILTINS — the global namespace of functions available to interpreted code
 * 5. Scope — the lexical scope chain used by the interpreter
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

const capturedLogs: unknown[][] = [];

export function getCapturedLogs(): unknown[][] {
  return capturedLogs;
}

export function clearCapturedLogs(): void {
  capturedLogs.length = 0;
}

/* ======================== CppIterator (begin/end sentinel) ======================== */

/**
 * Sentinel object returned by .begin() and .end() on arrays.
 * Global functions like reverse(), sort(), fill() detect these sentinels
 * and operate on the underlying array in-place.
 */
class CppIterator {
  __isCppIterator = true;
  constructor(
    public arr: any[],
    public index: number,
  ) {}
}

/* ======================== Array.prototype Polyfills ======================== */

function defArray(name: string, fn: (...args: any[]) => any) {
  if (!Array.prototype.hasOwnProperty(name)) {
    Object.defineProperty(Array.prototype, name, { value: fn, configurable: true, writable: true });
  }
}

// C++ STL methods
defArray("push_back", function (this: any[], x: any) { this.push(x); return this; });
defArray("pop_back", function (this: any[]) { return this.pop(); });
defArray("emplace_back", function (this: any[], ...args: any[]) { this.push(args.length === 1 ? args[0] : args); return this; });
defArray("front", function (this: any[]) { return this[0]; });
defArray("back", function (this: any[]) { return this[this.length - 1]; });
defArray("top", function (this: any[]) { return this[this.length - 1]; });
defArray("empty", function (this: any[]) { return this.length === 0; });
defArray("size", function (this: any[]) { return this.length; });
defArray("clear", function (this: any[]) { this.length = 0; return this; });
defArray("erase", function (this: any[], pos: any) {
  if (typeof pos === "number") { this.splice(pos, 1); }
  else if (pos && pos.__isCppIterator) { this.splice(pos.index, 1); }
  return this;
});
defArray("resize", function (this: any[], n: number, fill?: any) {
  const f = fill !== undefined ? fill : 0;
  if (n > this.length) { while (this.length < n) this.push(f); }
  else { this.length = n; }
  return this;
});
defArray("begin", function (this: any[]) { return new CppIterator(this, 0); });
defArray("end", function (this: any[]) { return new CppIterator(this, this.length); });
defArray("rbegin", function (this: any[]) { return new CppIterator(this, this.length - 1); });
defArray("rend", function (this: any[]) { return new CppIterator(this, -1); });

// Java List/Queue/Deque methods
defArray("add", function (this: any[], x: any) { this.push(x); return true; });
defArray("offer", function (this: any[], x: any) { this.push(x); return true; });
defArray("poll", function (this: any[]) { return this.shift(); });
defArray("peek", function (this: any[]) { return this[0]; });
defArray("get", function (this: any[], i: number) { return this[i]; });
defArray("set", function (this: any[], i: number, v: any) { this[i] = v; return this; });
defArray("isEmpty", function (this: any[]) { return this.length === 0; });
defArray("contains", function (this: any[], val: any) { return this.indexOf(val) !== -1; });
defArray("remove", function (this: any[], val: any) {
  if (typeof val === "number" && Number.isInteger(val) && val >= 0 && val < this.length) {
    return this.splice(val, 1)[0];
  }
  const idx = this.indexOf(val);
  if (idx !== -1) { this.splice(idx, 1); return true; }
  return false;
});
defArray("subList", function (this: any[], from: number, to: number) { return this.slice(from, to); });
defArray("addAll", function (this: any[], other: any[]) {
  if (Array.isArray(other)) for (const x of other) this.push(x);
  return true;
});
defArray("toArray", function (this: any[]) { return [...this]; });
defArray("count", function (this: any[], val: any) {
  let c = 0; for (const x of this) if (x === val) c++; return c;
});
defArray("insert", function (this: any[], pos: any, val?: any) {
  if (typeof pos === "number" && val !== undefined) { this.splice(pos, 0, val); }
  else { this.push(pos); }
  return this;
});

// C++ std::pair first / second accessors on arrays [a, b]
if (!Object.prototype.hasOwnProperty.call(Array.prototype, "first")) {
  Object.defineProperty(Array.prototype, "first", {
    get() { return this[0]; },
    set(v: any) { this[0] = v; },
    configurable: true,
  });
}

if (!Object.prototype.hasOwnProperty.call(Array.prototype, "second")) {
  Object.defineProperty(Array.prototype, "second", {
    get() { return this[1]; },
    set(v: any) { this[1] = v; },
    configurable: true,
  });
}

/* ======================== Map.prototype Polyfills ======================== */

function defMap(name: string, fn: (...args: any[]) => any) {
  if (!Map.prototype.hasOwnProperty(name)) {
    Object.defineProperty(Map.prototype, name, { value: fn, configurable: true, writable: true });
  }
}

defMap("getOrDefault", function (this: Map<any, any>, k: any, d: any) { return this.has(k) ? this.get(k) : d; });
defMap("containsKey", function (this: Map<any, any>, k: any) { return this.has(k); });
defMap("put", function (this: Map<any, any>, k: any, v: any) { this.set(k, v); return v; });
defMap("isEmpty", function (this: Map<any, any>) { return this.size === 0; });
defMap("keySet", function (this: Map<any, any>) { return Array.from(this.keys()); });
defMap("entrySet", function (this: Map<any, any>) { return Array.from(this.entries()); });
defMap("containsValue", function (this: Map<any, any>, v: any) {
  for (const val of this.values()) if (val === v) return true; return false;
});
defMap("remove", function (this: Map<any, any>, k: any) { const v = this.get(k); this.delete(k); return v; });
defMap("putIfAbsent", function (this: Map<any, any>, k: any, v: any) { if (!this.has(k)) this.set(k, v); return this.get(k); });
defMap("count", function (this: Map<any, any>, k: any) { return this.has(k) ? 1 : 0; });
defMap("find", function (this: Map<any, any>, k: any) { return this.has(k) ? k : null; });
defMap("end", function () { return null; });
defMap("erase", function (this: Map<any, any>, k: any) { this.delete(k); });
defMap("empty", function (this: Map<any, any>) { return this.size === 0; });
defMap("insert", function (this: Map<any, any>, pair: any) { if (Array.isArray(pair) && pair.length >= 2) this.set(pair[0], pair[1]); });
defMap("begin", function (this: Map<any, any>) { return new CppIterator(Array.from(this.entries()), 0); });

/* ======================== Set.prototype Polyfills ======================== */

function defSet(name: string, fn: (...args: any[]) => any) {
  if (!Set.prototype.hasOwnProperty(name)) {
    Object.defineProperty(Set.prototype, name, { value: fn, configurable: true, writable: true });
  }
}

defSet("contains", function (this: Set<any>, v: any) { return this.has(v); });
defSet("isEmpty", function (this: Set<any>) { return this.size === 0; });
defSet("empty", function (this: Set<any>) { return this.size === 0; });
defSet("count", function (this: Set<any>, v: any) { return this.has(v) ? 1 : 0; });
defSet("erase", function (this: Set<any>, v: any) { this.delete(v); });
defSet("insert", function (this: Set<any>, v: any) { this.add(v); });
defSet("find", function (this: Set<any>, v: any) { return this.has(v) ? v : null; });
defSet("end", function () { return null; });
defSet("addAll", function (this: Set<any>, other: Iterable<any>) { for (const v of other) this.add(v); return true; });
defSet("toArray", function (this: Set<any>) { return Array.from(this); });
defSet("begin", function (this: Set<any>) { return new CppIterator(Array.from(this), 0); });
defSet("remove", function (this: Set<any>, v: any) { return this.delete(v); });

/* ======================== String.prototype Polyfills ======================== */

function defStr(name: string, fn: (...args: any[]) => any) {
  if (!String.prototype.hasOwnProperty(name)) {
    Object.defineProperty(String.prototype, name, { value: fn, configurable: true, writable: true });
  }
}

defStr("equals", function (this: string, s: any) { return this.toString() === String(s); });
defStr("equalsIgnoreCase", function (this: string, s: any) { return this.toLowerCase() === String(s).toLowerCase(); });
defStr("toCharArray", function (this: string) { return this.split(""); });
defStr("compareTo", function (this: string, s: any) { return this.localeCompare(String(s)); });
defStr("isEmpty", function (this: string) { return this.length === 0; });
defStr("size", function (this: string) { return this.length; });
defStr("empty", function (this: string) { return this.length === 0; });
defStr("find", function (this: string, s: any) { return this.indexOf(String(s)); });
defStr("begin", function (this: string) { return new CppIterator(this.split(""), 0); });
defStr("end", function (this: string) { return new CppIterator(this.split(""), this.length); });
defStr("substr", function (this: string, pos: number, len?: number) {
  if (len !== undefined) return this.substring(pos, pos + len);
  return this.substring(pos);
});

/* ======================== C++ STL UnorderedMap ======================== */

const UM_METHODS = new Set(["has","count","find","end","begin","erase","size","empty","insert","clear","keys","values","entries","length"]);

class UnorderedMap {
  constructor(init?: any) {
    if (init && Array.isArray(init)) {
      for (const item of init) {
        if (Array.isArray(item)) (this as any)[item[0]] = item[1];
      }
    }
  }
  [Symbol.iterator]() {
    const entries = Object.entries(this).filter(([k]) => !UM_METHODS.has(k));
    return entries[Symbol.iterator]();
  }
  has(k: any) { return String(k) in this; }
  count(k: any) { return String(k) in this ? 1 : 0; }
  find(k: any) { return String(k) in this ? true : null; }
  end() { return null; }
  begin() { return new CppIterator(Object.entries(this).filter(([k]) => !UM_METHODS.has(k)), 0); }
  erase(k: any) { delete (this as any)[String(k)]; }
  size() { return Object.keys(this).filter(k => !UM_METHODS.has(k)).length; }
  get length() { return this.size(); }
  empty() { return this.size() === 0; }
  insert(pair: any) { if (Array.isArray(pair) && pair.length >= 2) (this as any)[pair[0]] = pair[1]; }
  clear() {
    for (const k of Object.keys(this)) {
      if (!UM_METHODS.has(k)) delete (this as any)[k];
    }
  }
}

/* ======================== LeetCode Data Structures ======================== */

class ListNode {
  val: number;
  next: ListNode | null;
  constructor(val = 0, next: ListNode | null = null) {
    this.val = val;
    this.next = next;
  }
}

class TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
  constructor(val = 0, left: TreeNode | null = null, right: TreeNode | null = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

/* ======================== PriorityQueue ======================== */

class PriorityQueue {
  private items: any[] = [];
  private cmp: (a: any, b: any) => number;
  constructor(cmp?: (a: any, b: any) => number) {
    this.cmp = cmp || ((a, b) => (typeof a === "number" ? a - b : 0));
  }
  offer(x: any) { this.add(x); return true; }
  add(x: any) { this.items.push(x); this.items.sort(this.cmp); }
  push(x: any) { this.add(x); }
  poll() { return this.items.shift(); }
  pop() { return this.items.shift(); }
  shift() { return this.items.shift(); }
  unshift(x: any) { this.add(x); }
  peek() { return this.items[0]; }
  top() { return this.items[0]; }
  size() { return this.items.length; }
  get length() { return this.items.length; }
  isEmpty() { return this.items.length === 0; }
  empty() { return this.items.length === 0; }
  clear() { this.items.length = 0; }
  toArray() { return [...this.items]; }
}

/* ======================== StringBuilder ======================== */

class StringBuilder {
  private str = "";
  constructor(init?: any) {
    if (init !== undefined && init !== null) this.str = String(init);
  }
  append(x: any) { this.str += String(x); return this; }
  charAt(i: number) { return this.str.charAt(i); }
  setCharAt(i: number, ch: string) { this.str = this.str.substring(0, i) + ch + this.str.substring(i + 1); }
  deleteCharAt(i: number) { this.str = this.str.substring(0, i) + this.str.substring(i + 1); return this; }
  length() { return this.str.length; }
  reverse() { this.str = this.str.split("").reverse().join(""); return this; }
  toString() { return this.str; }
  substring(start: number, end?: number) { return this.str.substring(start, end); }
  setLength(len: number) { this.str = this.str.slice(0, len); }
  insert(offset: number, s: any) { this.str = this.str.substring(0, offset) + String(s) + this.str.substring(offset); return this; }
}

/* ======================== Iterator-aware Global Functions ======================== */

function resolveIteratorArgs(arg1: any, arg2?: any): { arr: any[]; start: number; end: number } | null {
  if (arg1 && arg1.__isCppIterator && arg2 && arg2.__isCppIterator) {
    if (arg1.arr === arg2.arr) {
      return { arr: arg1.arr, start: Math.min(arg1.index, arg2.index), end: Math.max(arg1.index, arg2.index) };
    }
  }
  if (Array.isArray(arg1) && arg2 === undefined) {
    return { arr: arg1, start: 0, end: arg1.length };
  }
  return null;
}

function globalReverse(...args: any[]): any {
  const resolved = resolveIteratorArgs(args[0], args[1]);
  if (resolved) {
    const { arr, start, end } = resolved;
    const sub = arr.slice(start, end).reverse();
    for (let i = 0; i < sub.length; i++) arr[start + i] = sub[i];
    return arr;
  }
  if (Array.isArray(args[0])) return args[0].reverse();
  return args[0];
}

function defaultCmp(a: any, b: any): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (Array.isArray(a) && Array.isArray(b)) {
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
      const diff = defaultCmp(a[i], b[i]);
      if (diff !== 0) return diff;
    }
    return a.length - b.length;
  }
  return String(a).localeCompare(String(b));
}

function globalSort(...args: any[]): any {
  const it1 = args[0], it2 = args[1], cmp = args[2] as ((a: any, b: any) => number) | undefined;
  if (it1 && it1.__isCppIterator && it2 && it2.__isCppIterator && it1.arr === it2.arr) {
    const start = Math.min(it1.index, it2.index);
    const end = Math.max(it1.index, it2.index);
    const sub = it1.arr.slice(start, end);
    sub.sort(cmp || defaultCmp);
    for (let i = 0; i < sub.length; i++) it1.arr[start + i] = sub[i];
    return it1.arr;
  }
  if (Array.isArray(args[0])) {
    const sortCmp = (cmp || args[1]) as ((a: any, b: any) => number) | undefined;
    return args[0].sort(sortCmp || defaultCmp);
  }
  return args[0];
}

function globalFill(...args: any[]): any {
  const resolved = resolveIteratorArgs(args[0], args[1]);
  if (resolved && args.length >= 3) {
    const { arr, start, end } = resolved;
    for (let i = start; i < end; i++) arr[i] = args[2];
    return arr;
  }
  if (Array.isArray(args[0])) return args[0].fill(args[1]);
  return args[0];
}

function globalDistance(it1: any, it2: any): number {
  if (it1 && it1.__isCppIterator && it2 && it2.__isCppIterator) {
    return Math.abs(it2.index - it1.index);
  }
  return 0;
}

function globalLowerBound(arrOrBegin: any, endOrVal: any, val?: any): number {
  let arr: any[], target: any;
  if (arrOrBegin && arrOrBegin.__isCppIterator) { arr = arrOrBegin.arr; target = val; }
  else if (Array.isArray(arrOrBegin)) { arr = arrOrBegin; target = endOrVal; }
  else return -1;
  let lo = 0, hi = arr.length;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (arr[mid] < target) lo = mid + 1; else hi = mid; }
  return lo;
}

function globalUpperBound(arrOrBegin: any, endOrVal: any, val?: any): number {
  let arr: any[], target: any;
  if (arrOrBegin && arrOrBegin.__isCppIterator) { arr = arrOrBegin.arr; target = val; }
  else if (Array.isArray(arrOrBegin)) { arr = arrOrBegin; target = endOrVal; }
  else return -1;
  let lo = 0, hi = arr.length;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (arr[mid] <= target) lo = mid + 1; else hi = mid; }
  return lo;
}

/* ======================== BUILTINS ======================== */

const BUILTINS: Record<string, any> = {
  Math, Array, Set, Map, Object, Number, String, Boolean,
  parseInt, parseFloat, isNaN, isFinite, Infinity, NaN, undefined,
  null: null, nullptr: null, NULL: null, true: true, false: false,

  // C / C++ standard limits
  INT_MIN: -2147483648, INT_MAX: 2147483647,
  LONG_MIN: -Number.MAX_SAFE_INTEGER, LONG_MAX: Number.MAX_SAFE_INTEGER,
  LLONG_MIN: -Number.MAX_SAFE_INTEGER, LLONG_MAX: Number.MAX_SAFE_INTEGER,

  // Java wrappers
  Integer: {
    MIN_VALUE: -2147483648, MAX_VALUE: 2147483647,
    max: Math.max, min: Math.min,
    parseInt: (s: string) => parseInt(s, 10),
    toString: (n: number) => String(n),
    valueOf: (s: string | number) => Number(s),
    compare: (x: number, y: number) => x - y,
  },
  Long: {
    MIN_VALUE: -Number.MAX_SAFE_INTEGER, MAX_VALUE: Number.MAX_SAFE_INTEGER,
    parseLong: (s: string) => parseInt(s, 10),
    compare: (x: number, y: number) => x - y,
  },
  Double: {
    MIN_VALUE: Number.MIN_VALUE, MAX_VALUE: Number.MAX_VALUE,
    parseDouble: (s: string) => parseFloat(s),
  },
  Character: {
    isDigit: (c: any) => /\d/.test(String(c)),
    isLetter: (c: any) => /[a-zA-Z]/.test(String(c)),
    isLetterOrDigit: (c: any) => /[a-zA-Z0-9]/.test(String(c)),
    isWhitespace: (c: any) => /\s/.test(String(c)),
    toLowerCase: (c: any) => String(c).toLowerCase(),
    toUpperCase: (c: any) => String(c).toUpperCase(),
    getNumericValue: (c: any) => parseInt(String(c), 10),
  },
  Arrays: {
    fill: (arr: any[], val: any, start?: number, end?: number) => {
      if (!Array.isArray(arr)) return arr;
      if (start !== undefined && end !== undefined) return arr.fill(val, start, end);
      return arr.fill(val);
    },
    sort: (arr: any[], cmp?: (a: any, b: any) => number) =>
      Array.isArray(arr) ? arr.sort(cmp || ((a: any, b: any) => (typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b))))) : arr,
    equals: (a: any[], b: any[]) => JSON.stringify(a) === JSON.stringify(b),
    asList: (...items: any[]) => items.flat(),
    copyOf: (arr: any[], len: number) => arr.slice(0, len),
    copyOfRange: (arr: any[], from: number, to: number) => arr.slice(from, to),
    binarySearch: (arr: number[], key: number) => {
      let l = 0, r = arr.length - 1;
      while (l <= r) {
        const m = (l + r) >> 1;
        if (arr[m] === key) return m;
        if (arr[m]! < key) l = m + 1; else r = m - 1;
      }
      return -1;
    },
    deepToString: (arr: any[]) => JSON.stringify(arr),
    stream: (arr: any[]) => arr,
  },
  Collections: {
    sort: (list: any[], cmp?: (a: any, b: any) => number) =>
      Array.isArray(list) ? list.sort(cmp || ((a: any, b: any) => (typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b))))) : list,
    reverse: (list: any[]) => (Array.isArray(list) ? list.reverse() : list),
    max: (list: number[]) => Math.max(...list),
    min: (list: number[]) => Math.min(...list),
    swap: (list: any[], i: number, j: number) => { const tmp = list[i]; list[i] = list[j]; list[j] = tmp; },
    frequency: (list: any[], o: any) => (Array.isArray(list) ? list.filter((x) => x === o).length : 0),
    unmodifiableList: (list: any[]) => [...list],
    emptyList: () => [],
    singletonList: (item: any) => [item],
  },

  // Data structure constructors
  ListNode, TreeNode, PriorityQueue,
  Priority_queue: PriorityQueue,
  priority_queue: PriorityQueue,
  StringBuilder, StringBuffer: StringBuilder,
  ArrayList: Array, LinkedList: Array, ArrayDeque: Array,
  HashSet: Set, HashMap: Map, TreeMap: Map, TreeSet: Set,
  LinkedHashSet: Set, LinkedHashMap: Map,
  Stack: Array,
  UnorderedMap, unordered_map: UnorderedMap,

  // C++ STL & Math helper functions (iterator-aware)
  max: (...args: any[]) => (Array.isArray(args[0]) ? Math.max(...args[0]) : Math.max(...args)),
  min: (...args: any[]) => (Array.isArray(args[0]) ? Math.min(...args[0]) : Math.min(...args)),
  abs: Math.abs,

  // Iterator-aware global functions
  reverse: globalReverse,
  sort: globalSort,
  fill: globalFill,
  distance: globalDistance,
  lower_bound: globalLowerBound,
  upper_bound: globalUpperBound,

  // Pair/tuple construction
  make_pair: (a: any, b: any) => [a, b],
  make_tuple: (...args: any[]) => args,

  // Accumulate
  accumulate: (arrOrBegin: any, endOrInit: any, init?: any) => {
    if (arrOrBegin && arrOrBegin.__isCppIterator) return arrOrBegin.arr.reduce((a: any, b: any) => a + b, init || 0);
    if (Array.isArray(arrOrBegin)) return arrOrBegin.reduce((a: any, b: any) => a + b, endOrInit || 0);
    return 0;
  },
  count: (arr: any[], val: any) => (Array.isArray(arr) ? arr.filter((x) => x === val).length : 0),

  // C++ conversion functions
  to_string: (x: any) => String(x),
  stoi: (s: any) => parseInt(String(s), 10),
  stol: (s: any) => parseInt(String(s), 10),
  stoll: (s: any) => parseInt(String(s), 10),
  stof: (s: any) => parseFloat(String(s)),
  stod: (s: any) => parseFloat(String(s)),
  atoi: (s: any) => parseInt(String(s), 10),
  __builtin_popcount: (n: any) => (Number(n).toString(2).match(/1/g) || []).length,
  __builtin_clz: (n: any) => Math.clz32(Number(n)),

  // Math
  floor: Math.floor, ceil: Math.ceil, round: Math.round,
  sqrt: Math.sqrt, pow: Math.pow, log: Math.log,
  log2: Math.log2, log10: Math.log10, exp: Math.exp,

  // Type conversion helpers
  float: (x: any) => (x === "inf" ? Infinity : x === "-inf" ? -Infinity : Number(x)),
  int: (x: any) => (typeof x === "number" ? Math.trunc(x) : parseInt(String(x), 10)),
  len: (x: any) => (Array.isArray(x) || typeof x === "string" ? x.length : x?.size ?? 0),
  sum: (arr: number[]) => (Array.isArray(arr) ? arr.reduce((a, b) => a + b, 0) : 0),

  // C++ STL Containers (constructors available as globals)
  vector: class Vector extends Array {
    constructor(...args: any[]) {
      if (args.length === 1 && typeof args[0] === "number") {
        super(args[0]); this.fill(0);
      } else if (args.length === 2 && typeof args[0] === "number") {
        super(args[0]);
        const fillVal = args[1];
        if (Array.isArray(fillVal)) {
          for (let i = 0; i < args[0]; i++) this[i] = [...fillVal];
        } else { this.fill(fillVal); }
      } else {
        super(...(args as number[]));
      }
    }
  },
  queue: class Queue extends Array {
    override push(x: any): number { super.push(x); return this.length; }
    override pop(): any { return this.shift(); }
    front() { return this[0]; }
    empty() { return this.length === 0; }
    size() { return this.length; }
  },
  stack: class Stack extends Array {
    empty() { return this.length === 0; }
    top() { return this[this.length - 1]; }
    size() { return this.length; }
  },
  deque: class Deque extends Array {
    push_front(x: any) { this.unshift(x); }
    push_back(x: any) { this.push(x); }
    pop_front() { return this.shift(); }
    pop_back() { return this.pop(); }
    front() { return this[0]; }
    back() { return this[this.length - 1]; }
    empty() { return this.length === 0; }
    size() { return this.length; }
  },
  set: Set,
  unordered_set: Set,
  map: UnorderedMap,
  pair: (a: any, b: any) => [a, b],
  tuple: (...args: any[]) => args,
  swap: (a: any, b: any) => [b, a],
  npos: -1,
  string: { npos: -1 },

  // Console
  console: {
    log: (...args: any[]) => { capturedLogs.push(args); },
  },
};

/* ======================== Scope Chain ======================== */

export class Scope {
  private bindings: Map<string, unknown> = new Map();
  private constants: Set<string> = new Set();
  readonly parent: Scope | null;
  readonly isFunctionScope: boolean;

  constructor(parent: Scope | null = null, isFunctionScope = false) {
    this.parent = parent;
    this.isFunctionScope = isFunctionScope;
  }

  define(name: string, value: unknown, isConst = false): void {
    this.bindings.set(name, value);
    if (isConst) this.constants.add(name);
  }

  defineVar(name: string, value: unknown): void {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let scope: Scope = this;
    while (!scope.isFunctionScope && scope.parent) {
      scope = scope.parent;
    }
    scope.bindings.set(name, value);
  }

  get(name: string): unknown {
    if (this.bindings.has(name)) return this.bindings.get(name);
    if (this.parent) return this.parent.get(name);
    if (name in BUILTINS) return BUILTINS[name];
    throw new ReferenceError(`${name} is not defined`);
  }

  has(name: string): boolean {
    if (this.bindings.has(name)) return true;
    if (this.parent) return this.parent.has(name);
    return name in BUILTINS;
  }

  set(name: string, value: unknown): void {
    if (this.bindings.has(name)) {
      if (this.constants.has(name)) {
        throw new TypeError(`Assignment to constant variable '${name}'`);
      }
      this.bindings.set(name, value);
      return;
    }
    let ancestor: Scope | null = this.parent;
    while (ancestor) {
      if (ancestor.bindings.has(name)) {
        if (ancestor.constants.has(name)) {
          throw new TypeError(`Assignment to constant variable '${name}'`);
        }
        ancestor.bindings.set(name, value);
        return;
      }
      ancestor = ancestor.parent;
    }
    // New variable without let/var — bind in current local scope
    this.bindings.set(name, value);
  }

  ownKeys(): string[] {
    return [...this.bindings.keys()];
  }

  allVariables(): Record<string, unknown> {
    const vars: Record<string, unknown> = {};
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let scope: Scope | null = this;
    while (scope) {
      for (const [key, val] of scope.bindings) {
        if (!(key in vars) && key !== "this" && key !== "self" && typeof val !== "function") {
          vars[key] = val;
        }
      }
      scope = scope.parent;
    }
    return vars;
  }

  child(): Scope {
    return new Scope(this, false);
  }

  childFunction(): Scope {
    return new Scope(this, true);
  }
}

export function createGlobalScope(): Scope {
  return new Scope(null, true);
}
