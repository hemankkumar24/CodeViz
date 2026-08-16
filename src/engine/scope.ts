/**
 * Scope chain for the step-by-step interpreter.
 */

const capturedLogs: unknown[][] = [];

export function getCapturedLogs(): unknown[][] {
  return capturedLogs;
}

export function clearCapturedLogs(): void {
  capturedLogs.length = 0;
}

// Polyfill array methods for C++ & Java container compatibility
if (!Array.prototype.hasOwnProperty("add")) {
  Object.defineProperty(Array.prototype, "add", {
    value: function (x: unknown) {
      this.push(x);
      return this;
    },
    configurable: true,
    writable: true,
  });
}

if (!Array.prototype.hasOwnProperty("front")) {
  Object.defineProperty(Array.prototype, "front", {
    value: function () {
      return this[0];
    },
    configurable: true,
    writable: true,
  });
}

if (!Array.prototype.hasOwnProperty("back")) {
  Object.defineProperty(Array.prototype, "back", {
    value: function () {
      return this[this.length - 1];
    },
    configurable: true,
    writable: true,
  });
}

if (!Array.prototype.hasOwnProperty("top")) {
  Object.defineProperty(Array.prototype, "top", {
    value: function () {
      return this[this.length - 1];
    },
    configurable: true,
    writable: true,
  });
}

if (!Array.prototype.hasOwnProperty("empty")) {
  Object.defineProperty(Array.prototype, "empty", {
    value: function () {
      return this.length === 0;
    },
    configurable: true,
    writable: true,
  });
}

if (!Array.prototype.hasOwnProperty("size")) {
  Object.defineProperty(Array.prototype, "size", {
    value: function () {
      return this.length;
    },
    configurable: true,
    writable: true,
  });
}

if (!Array.prototype.hasOwnProperty("poll")) {
  Object.defineProperty(Array.prototype, "poll", {
    value: function () {
      return this.shift();
    },
    configurable: true,
    writable: true,
  });
}

if (!Array.prototype.hasOwnProperty("peek")) {
  Object.defineProperty(Array.prototype, "peek", {
    value: function () {
      return this[0];
    },
    configurable: true,
    writable: true,
  });
}

if (!Array.prototype.hasOwnProperty("get")) {
  Object.defineProperty(Array.prototype, "get", {
    value: function (i: number) {
      return this[i];
    },
    configurable: true,
    writable: true,
  });
}

if (!Array.prototype.hasOwnProperty("set")) {
  Object.defineProperty(Array.prototype, "set", {
    value: function (i: number, v: unknown) {
      this[i] = v;
      return this;
    },
    configurable: true,
    writable: true,
  });
}

if (!Array.prototype.hasOwnProperty("isEmpty")) {
  Object.defineProperty(Array.prototype, "isEmpty", {
    value: function () {
      return this.length === 0;
    },
    configurable: true,
    writable: true,
  });
}

// C++ std::pair first / second accessors on arrays [a, b]
if (!Object.prototype.hasOwnProperty.call(Array.prototype, "first")) {
  Object.defineProperty(Array.prototype, "first", {
    get() {
      return this[0];
    },
    set(v: unknown) {
      this[0] = v;
    },
    configurable: true,
  });
}

if (!Object.prototype.hasOwnProperty.call(Array.prototype, "second")) {
  Object.defineProperty(Array.prototype, "second", {
    get() {
      return this[1];
    },
    set(v: unknown) {
      this[1] = v;
    },
    configurable: true,
  });
}

// Map prototype polyfills for Java
if (!Map.prototype.hasOwnProperty("getOrDefault")) {
  Object.defineProperty(Map.prototype, "getOrDefault", {
    value: function (k: unknown, d: unknown) {
      return this.has(k) ? this.get(k) : d;
    },
    configurable: true,
    writable: true,
  });
}

if (!Map.prototype.hasOwnProperty("containsKey")) {
  Object.defineProperty(Map.prototype, "containsKey", {
    value: function (k: unknown) {
      return this.has(k);
    },
    configurable: true,
    writable: true,
  });
}

if (!Map.prototype.hasOwnProperty("put")) {
  Object.defineProperty(Map.prototype, "put", {
    value: function (k: unknown, v: unknown) {
      this.set(k, v);
      return v;
    },
    configurable: true,
    writable: true,
  });
}

if (!Map.prototype.hasOwnProperty("isEmpty")) {
  Object.defineProperty(Map.prototype, "isEmpty", {
    value: function () {
      return this.size === 0;
    },
    configurable: true,
    writable: true,
  });
}

if (!Map.prototype.hasOwnProperty("keySet")) {
  Object.defineProperty(Map.prototype, "keySet", {
    value: function () {
      return Array.from(this.keys());
    },
    configurable: true,
    writable: true,
  });
}

// Set prototype polyfills for Java
if (!Set.prototype.hasOwnProperty("contains")) {
  Object.defineProperty(Set.prototype, "contains", {
    value: function (v: unknown) {
      return this.has(v);
    },
    configurable: true,
    writable: true,
  });
}

if (!Set.prototype.hasOwnProperty("isEmpty")) {
  Object.defineProperty(Set.prototype, "isEmpty", {
    value: function () {
      return this.size === 0;
    },
    configurable: true,
    writable: true,
  });
}

// C++ STL UnorderedMap with object-like bracket access & method compatibility
class UnorderedMap {
  constructor(init?: unknown) {
    if (init && Array.isArray(init)) {
      for (const item of init) {
        if (Array.isArray(item)) (this as any)[item[0]] = item[1];
      }
    }
  }
  has(k: unknown) {
    return String(k) in this;
  }
  count(k: unknown) {
    return String(k) in this ? 1 : 0;
  }
  find(k: unknown) {
    return String(k) in this ? true : null;
  }
  end() {
    return null;
  }
  erase(k: unknown) {
    delete (this as any)[String(k)];
  }
  size() {
    return Object.keys(this).length;
  }
  get length() {
    return Object.keys(this).length;
  }
  empty() {
    return Object.keys(this).length === 0;
  }
}

// String prototype polyfills for Java
if (!String.prototype.hasOwnProperty("equals")) {
  Object.defineProperty(String.prototype, "equals", {
    value: function (s: unknown) {
      return this.toString() === String(s);
    },
    configurable: true,
    writable: true,
  });
}

if (!String.prototype.hasOwnProperty("equalsIgnoreCase")) {
  Object.defineProperty(String.prototype, "equalsIgnoreCase", {
    value: function (s: unknown) {
      return this.toLowerCase() === String(s).toLowerCase();
    },
    configurable: true,
    writable: true,
  });
}

if (!String.prototype.hasOwnProperty("toCharArray")) {
  Object.defineProperty(String.prototype, "toCharArray", {
    value: function () {
      return this.split("");
    },
    configurable: true,
    writable: true,
  });
}

if (!String.prototype.hasOwnProperty("compareTo")) {
  Object.defineProperty(String.prototype, "compareTo", {
    value: function (s: unknown) {
      return this.localeCompare(String(s));
    },
    configurable: true,
    writable: true,
  });
}

if (!String.prototype.hasOwnProperty("isEmpty")) {
  Object.defineProperty(String.prototype, "isEmpty", {
    value: function () {
      return this.length === 0;
    },
    configurable: true,
    writable: true,
  });
}

// LeetCode standard data structure definitions
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

class PriorityQueue {
  private items: unknown[] = [];
  private cmp: (a: any, b: any) => number;
  constructor(cmp?: (a: any, b: any) => number) {
    this.cmp = cmp || ((a, b) => (typeof a === "number" ? a - b : 0));
  }
  offer(x: unknown) {
    this.add(x);
    return true;
  }
  add(x: unknown) {
    this.items.push(x);
    this.items.sort(this.cmp);
  }
  push(x: unknown) {
    this.add(x);
  }
  poll() {
    return this.items.shift();
  }
  pop() {
    return this.items.shift();
  }
  shift() {
    return this.items.shift();
  }
  unshift(x: unknown) {
    this.add(x);
  }
  peek() {
    return this.items[0];
  }
  top() {
    return this.items[0];
  }
  size() {
    return this.items.length;
  }
  get length() {
    return this.items.length;
  }
  isEmpty() {
    return this.items.length === 0;
  }
  empty() {
    return this.items.length === 0;
  }
  clear() {
    this.items.length = 0;
  }
}

class StringBuilder {
  private str = "";
  constructor(init?: unknown) {
    if (init !== undefined && init !== null) this.str = String(init);
  }
  append(x: unknown) {
    this.str += String(x);
    return this;
  }
  charAt(i: number) {
    return this.str.charAt(i);
  }
  setCharAt(i: number, ch: string) {
    this.str = this.str.substring(0, i) + ch + this.str.substring(i + 1);
  }
  deleteCharAt(i: number) {
    this.str = this.str.substring(0, i) + this.str.substring(i + 1);
    return this;
  }
  length() {
    return this.str.length;
  }
  reverse() {
    this.str = this.str.split("").reverse().join("");
    return this;
  }
  toString() {
    return this.str;
  }
  substring(start: number, end?: number) {
    return this.str.substring(start, end);
  }
  setLength(len: number) {
    this.str = this.str.slice(0, len);
  }
}

const BUILTINS: Record<string, unknown> = {
  Math,
  Array,
  Set,
  Map,
  Object,
  Number,
  String,
  Boolean,
  parseInt,
  parseFloat,
  isNaN,
  isFinite,
  Infinity,
  NaN,
  undefined,
  null: null,
  nullptr: null,
  NULL: null,
  true: true,
  false: false,
  // C / C++ standard limits
  INT_MIN: -2147483648,
  INT_MAX: 2147483647,
  LONG_MIN: -Number.MAX_SAFE_INTEGER,
  LONG_MAX: Number.MAX_SAFE_INTEGER,
  LLONG_MIN: -Number.MAX_SAFE_INTEGER,
  LLONG_MAX: Number.MAX_SAFE_INTEGER,
  // Java wrappers & classes
  Integer: {
    MIN_VALUE: -2147483648,
    MAX_VALUE: 2147483647,
    max: Math.max,
    min: Math.min,
    parseInt: (s: string) => parseInt(s, 10),
    toString: (n: number) => String(n),
    valueOf: (s: string | number) => Number(s),
    compare: (x: number, y: number) => x - y,
  },
  Long: {
    MIN_VALUE: -Number.MAX_SAFE_INTEGER,
    MAX_VALUE: Number.MAX_SAFE_INTEGER,
    parseLong: (s: string) => parseInt(s, 10),
    compare: (x: number, y: number) => x - y,
  },
  Double: {
    MIN_VALUE: Number.MIN_VALUE,
    MAX_VALUE: Number.MAX_VALUE,
    parseDouble: (s: string) => parseFloat(s),
  },
  Character: {
    isDigit: (c: unknown) => /\d/.test(String(c)),
    isLetter: (c: unknown) => /[a-zA-Z]/.test(String(c)),
    isLetterOrDigit: (c: unknown) => /[a-zA-Z0-9]/.test(String(c)),
    isWhitespace: (c: unknown) => /\s/.test(String(c)),
    toLowerCase: (c: unknown) => String(c).toLowerCase(),
    toUpperCase: (c: unknown) => String(c).toUpperCase(),
    getNumericValue: (c: unknown) => parseInt(String(c), 10),
  },
  Arrays: {
    fill: (arr: unknown[], val: unknown) => (Array.isArray(arr) ? arr.fill(val) : arr),
    sort: (arr: unknown[], cmp?: (a: any, b: any) => number) =>
      Array.isArray(arr) ? arr.sort(cmp || ((a: any, b: any) => (typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b))))) : arr,
    equals: (a: unknown[], b: unknown[]) => JSON.stringify(a) === JSON.stringify(b),
    asList: (...items: unknown[]) => items,
    copyOf: (arr: unknown[], len: number) => arr.slice(0, len),
    copyOfRange: (arr: unknown[], from: number, to: number) => arr.slice(from, to),
    binarySearch: (arr: number[], key: number) => {
      let l = 0, r = arr.length - 1;
      while (l <= r) {
        const m = (l + r) >> 1;
        const val = arr[m];
        if (val === undefined || val === key) return val === key ? m : -1;
        if (val < key) l = m + 1; else r = m - 1;
      }
      return -1;
    },
  },
  Collections: {
    sort: (list: unknown[], cmp?: (a: any, b: any) => number) =>
      Array.isArray(list) ? list.sort(cmp || ((a: any, b: any) => (typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b))))) : list,
    reverse: (list: unknown[]) => (Array.isArray(list) ? list.reverse() : list),
    max: (list: number[]) => Math.max(...list),
    min: (list: number[]) => Math.min(...list),
    swap: (list: unknown[], i: number, j: number) => {
      const tmp = list[i];
      list[i] = list[j];
      list[j] = tmp;
    },
    frequency: (list: unknown[], o: unknown) => (Array.isArray(list) ? list.filter((x) => x === o).length : 0),
  },
  ListNode,
  TreeNode,
  PriorityQueue,
  Priority_queue: PriorityQueue,
  priority_queue: PriorityQueue,
  StringBuilder,
  ArrayList: Array,
  LinkedList: Array,
  ArrayDeque: Array,
  HashSet: Set,
  HashMap: Map,
  Stack: Array,
  UnorderedMap,
  unordered_map: UnorderedMap,
  map: UnorderedMap,
  // C++ STL & Math helper functions
  max: (...args: unknown[]) => (Array.isArray(args[0]) ? Math.max(...(args[0] as number[])) : Math.max(...(args as number[]))),
  min: (...args: unknown[]) => (Array.isArray(args[0]) ? Math.min(...(args[0] as number[])) : Math.min(...(args as number[]))),
  abs: Math.abs,
  swap: (a: unknown[], b?: unknown) => {
    if (Array.isArray(a) && typeof b === "number") {
      // swap in array
    }
  },
  reverse: (arr: unknown[]) => (Array.isArray(arr) ? arr.reverse() : arr),
  sort: (arr: unknown[], cmp?: (a: any, b: any) => number) =>
    Array.isArray(arr) ? arr.sort(cmp || ((a: any, b: any) => (typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b))))) : arr,
  accumulate: (arr: number[], init = 0) => (Array.isArray(arr) ? arr.reduce((a, b) => a + b, init) : init),
  count: (arr: unknown[], val: unknown) => (Array.isArray(arr) ? arr.filter((x) => x === val).length : 0),
  fill: (arr: unknown[], val: unknown) => (Array.isArray(arr) ? arr.fill(val) : arr),
  to_string: (x: unknown) => String(x),
  stoi: (s: unknown) => parseInt(String(s), 10),
  stol: (s: unknown) => parseInt(String(s), 10),
  stoll: (s: unknown) => parseInt(String(s), 10),
  __builtin_popcount: (n: unknown) => (Number(n).toString(2).match(/1/g) || []).length,
  floor: Math.floor,
  ceil: Math.ceil,
  round: Math.round,
  sqrt: Math.sqrt,
  pow: Math.pow,
  float: (x: unknown) => (x === "inf" ? Infinity : x === "-inf" ? -Infinity : Number(x)),
  int: (x: unknown) => (typeof x === "number" ? Math.trunc(x) : parseInt(String(x), 10)),
  len: (x: unknown) => (Array.isArray(x) || typeof x === "string" ? x.length : (x as { size?: number })?.size ?? 0),
  sum: (arr: number[]) => (Array.isArray(arr) ? arr.reduce((a, b) => a + b, 0) : 0),
  // C++ STL Polyfills & Containers
  vector: class Vector extends Array {
    constructor(...args: unknown[]) {
      if (args.length === 1 && typeof args[0] === "number") {
        super(args[0]);
        this.fill(0);
      } else if (args.length === 2 && typeof args[0] === "number") {
        super(args[0]);
        this.fill(args[1]);
      } else {
        super(...(args as number[]));
      }
    }
  },
  queue: class Queue extends Array {
    override push(x: unknown): number {
      super.push(x);
      return this.length;
    }
    override pop(): unknown {
      return this.shift();
    }
    front() {
      return this[0];
    }
    empty() {
      return this.length === 0;
    }
    size() {
      return this.length;
    }
  },
  stack: class Stack extends Array {
    empty() {
      return this.length === 0;
    }
    top() {
      return this[this.length - 1];
    }
    size() {
      return this.length;
    }
  },
  console: {
    log: (...args: unknown[]) => {
      capturedLogs.push(args);
    },
  },
};

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
