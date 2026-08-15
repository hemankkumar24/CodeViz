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
  // Java wrappers
  Integer: {
    MIN_VALUE: -2147483648,
    MAX_VALUE: 2147483647,
    max: Math.max,
    min: Math.min,
    parseInt: (s: string) => parseInt(s, 10),
  },
  Long: {
    MIN_VALUE: -Number.MAX_SAFE_INTEGER,
    MAX_VALUE: Number.MAX_SAFE_INTEGER,
  },
  // Python & global math helpers
  max: Math.max,
  min: Math.min,
  abs: Math.abs,
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
