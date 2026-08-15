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

// Polyfill array .add() for Java compatibility
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
  true: true,
  false: false,
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
