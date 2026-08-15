/**
 * Step-by-step JavaScript interpreter built on acorn's ESTree AST.
 */

import * as acorn from "acorn";
import type * as ESTree from "estree";
import { Scope, createGlobalScope, clearCapturedLogs, getCapturedLogs } from "./scope";
import { Tracer, type StepContext, generateExplanation, deepClone } from "./tracer";
import type { ExecutionEvent, CallFrame } from "@/types/execution";

/* ----------------------------- Config ------------------------------------ */

export type InterpreterConfig = {
  code: string;
  args: Record<string, unknown>;
  entryFunction?: string | undefined;
  maxSteps?: number;
  timeoutMs?: number;
};

export type InterpreterResult = {
  events: ExecutionEvent[];
  returnValue: unknown;
  error: { line: number; message: string } | null;
  totalSteps: number;
  executionTimeMs: number;
  logs: unknown[][];
};

/* ---------------------- Sentinel values ---------------------------------- */

const BREAK_SIGNAL = Symbol("break");
const CONTINUE_SIGNAL = Symbol("continue");

class ReturnSignal {
  constructor(public value: unknown) {}
}

/* ------------------------------ Interpreter ------------------------------ */

export class Interpreter {
  private scope: Scope;
  private tracer: Tracer;
  private callstack: CallFrame[] = [];
  private callIdCounter = 0;
  private stepCount = 0;
  private maxSteps: number;
  private deadline: number;
  private code: string;
  private userFunctions: Map<string, ESTree.FunctionDeclaration | ESTree.FunctionExpression> = new Map();
  private classInstances: Map<string, Record<string, unknown>> = new Map();

  constructor(config: InterpreterConfig) {
    this.code = config.code;
    this.maxSteps = config.maxSteps ?? 10_000;
    this.deadline = Date.now() + (config.timeoutMs ?? 5_000);
    this.scope = createGlobalScope();
    this.tracer = new Tracer();
    clearCapturedLogs();
  }

  run(config: InterpreterConfig): InterpreterResult {
    const startTime = Date.now();

    try {
      const ast = acorn.parse(this.code, {
        ecmaVersion: 2022,
        sourceType: "script",
        locations: true,
      }) as unknown as ESTree.Program;

      // 1. Collect all functions and class methods
      this.collectFunctions(ast);

      // 2. Find the entry function
      const entryName = config.entryFunction ?? this.findEntryFunction();

      // 3. Execute top-level declarations (registering classes, globals, functions)
      this.executeTopLevel(ast);

      if (entryName && this.userFunctions.has(entryName)) {
        const fn = this.userFunctions.get(entryName)!;
        const argValues = this.buildArgValues(fn, config.args);
        
        // Find which class instance owns this method (if any)
        let thisContext: Record<string, unknown> | undefined;
        for (const [_, inst] of this.classInstances) {
          if (entryName in inst) {
            thisContext = inst;
            break;
          }
        }
        if (!thisContext && this.classInstances.size > 0) {
          thisContext = this.classInstances.values().next().value;
        }

        const result = this.callFunction(fn, argValues, entryName, thisContext);

        return {
          events: this.tracer.build(),
          returnValue: result,
          error: null,
          totalSteps: this.stepCount,
          executionTimeMs: Date.now() - startTime,
          logs: getCapturedLogs(),
        };
      } else {
        // Fallback: already executed top-level statements
        return {
          events: this.tracer.build(),
          returnValue: undefined,
          error: null,
          totalSteps: this.stepCount,
          executionTimeMs: Date.now() - startTime,
          logs: getCapturedLogs(),
        };
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      const line = this.extractLineNumber(error);

      return {
        events: this.tracer.build(),
        returnValue: undefined,
        error: { line, message: error.message },
        totalSteps: this.stepCount,
        executionTimeMs: Date.now() - startTime,
        logs: getCapturedLogs(),
      };
    }
  }

  /* ========================== Collection pass ============================= */

  private collectFunctions(ast: ESTree.Program): void {
    for (const node of ast.body) {
      if (node.type === "FunctionDeclaration" && node.id) {
        this.userFunctions.set(node.id.name, node);
      } else if (node.type === "VariableDeclaration") {
        for (const decl of node.declarations) {
          if (
            decl.id.type === "Identifier" &&
            decl.init &&
            (decl.init.type === "FunctionExpression" || decl.init.type === "ArrowFunctionExpression")
          ) {
            this.userFunctions.set(decl.id.name, decl.init as unknown as ESTree.FunctionExpression);
          }
        }
      } else if (node.type === "ClassDeclaration") {
        for (const item of node.body.body) {
          if (item.type === "MethodDefinition" && item.key.type === "Identifier" && item.key.name !== "constructor") {
            this.userFunctions.set(item.key.name, item.value);
          }
        }
      }
    }
  }

  private findEntryFunction(): string | undefined {
    if (this.userFunctions.size === 1) {
      return this.userFunctions.keys().next().value;
    }
    // Prefer non-helper names
    for (const name of this.userFunctions.keys()) {
      if (!name.startsWith("_") && !name.startsWith("#") && !name.toLowerCase().includes("util") && name !== "helper") {
        return name;
      }
    }
    return this.userFunctions.keys().next().value;
  }

  private executeTopLevel(ast: ESTree.Program): void {
    for (const node of ast.body) {
      if (node.type === "FunctionDeclaration") {
        if (node.id) this.scope.define(node.id.name, node);
      } else if (node.type === "ClassDeclaration") {
        this.execClassDeclaration(node);
      } else if (node.type === "VariableDeclaration") {
        this.execVariableDeclaration(node, this.getLine(node));
      } else {
        this.execStatement(node);
      }
    }
  }

  private execClassDeclaration(node: ESTree.ClassDeclaration): void {
    const className = node.id?.name ?? "Solution";
    const instance: Record<string, unknown> = {};

    for (const item of node.body.body) {
      if (item.type === "MethodDefinition" && item.key.type === "Identifier") {
        const methodName = item.key.name;
        const methodNode = item.value;
        this.userFunctions.set(methodName, methodNode);
        instance[methodName] = (...methodArgs: unknown[]) =>
          this.callFunction(methodNode, methodArgs, methodName, instance);
      }
    }

    this.scope.define(className, instance);
    this.classInstances.set(className, instance);
    // Also define "Solution" as the instance itself so Solution.method() or direct call works
    this.scope.define("this", instance);
  }

  private buildArgValues(
    fn: ESTree.FunctionDeclaration | ESTree.FunctionExpression,
    args: Record<string, unknown>,
  ): unknown[] {
    const params = fn.params;
    const values: unknown[] = [];

    for (let i = 0; i < params.length; i++) {
      const param = params[i]!;
      let paramName = "";
      let defaultVal: unknown = undefined;
      let hasDefault = false;

      if (param.type === "Identifier") {
        paramName = param.name;
      } else if (param.type === "AssignmentPattern" && param.left.type === "Identifier") {
        paramName = param.left.name;
        defaultVal = this.evalExpression(param.right);
        hasDefault = true;
      }

      if (!paramName || paramName === "self" || paramName === "this") {
        values.push(undefined);
        continue;
      }

      if (paramName in args && args[paramName] !== undefined) {
        values.push(deepClone(args[paramName]));
      } else if (hasDefault) {
        values.push(defaultVal);
      } else {
        values.push(undefined);
      }
    }
    return values;
  }

  /* ============================ Limits & Steps =========================== */

  private checkLimits(line?: number): void {
    this.stepCount++;
    if (this.stepCount > this.maxSteps) {
      throw new Error(`Execution exceeded ${this.maxSteps} steps — possible infinite loop.`);
    }
    if (Date.now() > this.deadline) {
      throw new Error(`Execution timed out. Possible infinite loop.`);
    }
    void line;
  }

  private emitStep(line: number, nodeType: string, sourceText?: string): void {
    const variables = this.scope.allVariables();
    const explanation = generateExplanation(nodeType, variables, sourceText);
    const ctx: StepContext = { line, nodeType, variables };
    if (explanation) ctx.explanation = explanation;
    if (this.callstack.length) ctx.callstack = [...this.callstack];
    if (sourceText) ctx.sourceText = sourceText;
    this.tracer.record(ctx);
  }

  private getLine(node: ESTree.Node): number {
    return (node as { loc?: { start: { line: number } } }).loc?.start.line ?? 1;
  }

  private getSourceText(node: ESTree.Node): string {
    const loc = node as { start?: number; end?: number };
    if (typeof loc.start === "number" && typeof loc.end === "number") {
      return this.code.slice(loc.start, loc.end);
    }
    return "";
  }

  private extractLineNumber(error: Error): number {
    const match = /\((\d+):(\d+)\)/.exec(error.message);
    if (match) return Number(match[1]);
    return 1;
  }

  /* ========================= Statements =================================== */

  private execStatement(node: ESTree.Statement | ESTree.Declaration | ESTree.ModuleDeclaration): unknown {
    const line = this.getLine(node);

    switch (node.type) {
      case "ExpressionStatement":
        return this.execExpressionStatement(node, line);
      case "VariableDeclaration":
        return this.execVariableDeclaration(node, line);
      case "FunctionDeclaration":
        if (node.id) this.scope.define(node.id.name, node);
        return undefined;
      case "ReturnStatement":
        return this.execReturnStatement(node, line);
      case "IfStatement":
        return this.execIfStatement(node, line);
      case "ForStatement":
        return this.execForStatement(node, line);
      case "WhileStatement":
        return this.execWhileStatement(node, line);
      case "DoWhileStatement":
        return this.execDoWhileStatement(node, line);
      case "ForInStatement":
        return this.execForInStatement(node, line);
      case "ForOfStatement":
        return this.execForOfStatement(node, line);
      case "BlockStatement":
        return this.execBlock(node);
      case "BreakStatement":
        return BREAK_SIGNAL;
      case "ContinueStatement":
        return CONTINUE_SIGNAL;
      case "SwitchStatement":
        return this.execSwitchStatement(node, line);
      case "ThrowStatement":
        throw this.evalExpression(node.argument);
      case "ClassDeclaration":
        this.execClassDeclaration(node);
        return undefined;
      case "EmptyStatement":
        return undefined;
      default:
        return undefined;
    }
  }

  private execExpressionStatement(node: ESTree.ExpressionStatement, line: number): unknown {
    const result = this.evalExpression(node.expression);
    if (
      node.expression.type === "AssignmentExpression" ||
      node.expression.type === "UpdateExpression" ||
      node.expression.type === "CallExpression"
    ) {
      this.checkLimits(line);
      this.emitStep(line, node.expression.type, this.getSourceText(node.expression));
    }
    return result;
  }

  private execVariableDeclaration(node: ESTree.VariableDeclaration, line: number): void {
    const kind = node.kind === "var" ? "var" : node.kind === "const" ? "const" : "let";
    for (const decl of node.declarations) {
      const value = decl.init ? this.evalExpression(decl.init) : undefined;
      this.declarePattern(decl.id, value, kind);
    }
    this.checkLimits(line);
    this.emitStep(line, "VariableDeclaration", this.getSourceText(node));
  }

  private declarePattern(pattern: ESTree.Pattern, value: unknown, kind: "var" | "let" | "const"): void {
    switch (pattern.type) {
      case "Identifier":
        if (kind === "var") {
          this.scope.defineVar(pattern.name, value);
        } else {
          this.scope.define(pattern.name, value, kind === "const");
        }
        break;
      case "ArrayPattern":
        if (Array.isArray(value)) {
          for (let i = 0; i < pattern.elements.length; i++) {
            const elem = pattern.elements[i];
            if (elem) this.declarePattern(elem, value[i], kind);
          }
        }
        break;
      case "ObjectPattern":
        for (const prop of pattern.properties) {
          if (prop.type !== "RestElement") {
            const assignProp = prop as ESTree.AssignmentProperty;
            const key = assignProp.key.type === "Identifier" ? assignProp.key.name : String(this.evalExpression(assignProp.key as ESTree.Expression));
            this.declarePattern(assignProp.value as ESTree.Pattern, (value as Record<string, unknown>)?.[key], kind);
          }
        }
        break;
    }
  }

  private execReturnStatement(node: ESTree.ReturnStatement, line: number): ReturnSignal {
    const value = node.argument ? this.evalExpression(node.argument) : undefined;
    this.checkLimits(line);
    this.emitStep(line, "ReturnStatement", node.argument ? this.getSourceText(node.argument) : "void");
    return new ReturnSignal(value);
  }

  private execIfStatement(node: ESTree.IfStatement, line: number): unknown {
    const test = this.evalExpression(node.test);
    this.checkLimits(line);
    this.emitStep(line, "IfStatement", `${this.getSourceText(node.test)} → ${test ? "true" : "false"}`);
    if (test) {
      return this.execStatement(node.consequent as ESTree.Statement);
    } else if (node.alternate) {
      return this.execStatement(node.alternate as ESTree.Statement);
    }
    return undefined;
  }

  private execForStatement(node: ESTree.ForStatement, line: number): unknown {
    const blockScope = this.scope.child();
    const prevScope = this.scope;
    this.scope = blockScope;

    try {
      if (node.init) {
        if (node.init.type === "VariableDeclaration") {
          this.execVariableDeclaration(node.init, this.getLine(node.init));
        } else {
          this.evalExpression(node.init);
        }
      }

      while (true) {
        if (node.test) {
          const test = this.evalExpression(node.test);
          if (!test) break;
        }

        this.checkLimits(line);
        this.emitStep(line, "ForStatement");

        const result = node.body ? this.execStatement(node.body as ESTree.Statement) : undefined;
        if (result === BREAK_SIGNAL) break;
        if (result instanceof ReturnSignal) return result;

        if (node.update) {
          this.evalExpression(node.update);
        }
      }
    } finally {
      this.scope = prevScope;
    }
    return undefined;
  }

  private execWhileStatement(node: ESTree.WhileStatement, line: number): unknown {
    while (true) {
      const test = this.evalExpression(node.test);
      if (!test) break;

      this.checkLimits(line);
      this.emitStep(line, "WhileStatement");

      const result = this.execStatement(node.body as ESTree.Statement);
      if (result === BREAK_SIGNAL) break;
      if (result instanceof ReturnSignal) return result;
    }
    return undefined;
  }

  private execDoWhileStatement(node: ESTree.DoWhileStatement, line: number): unknown {
    do {
      this.checkLimits(line);
      this.emitStep(line, "DoWhileStatement");

      const result = this.execStatement(node.body as ESTree.Statement);
      if (result === BREAK_SIGNAL) break;
      if (result instanceof ReturnSignal) return result;
    } while (this.evalExpression(node.test));
    return undefined;
  }

  private execForInStatement(node: ESTree.ForInStatement, line: number): unknown {
    const obj = this.evalExpression(node.right) as Record<string, unknown>;
    const blockScope = this.scope.child();
    const prevScope = this.scope;
    this.scope = blockScope;

    try {
      for (const key of Object.keys(obj)) {
        if (node.left.type === "VariableDeclaration") {
          const decl = node.left.declarations[0]!;
          const leftKind = node.left.kind === "var" ? "var" as const : node.left.kind === "const" ? "const" as const : "let" as const;
          this.declarePattern(decl.id, key, leftKind);
        } else {
          this.assignTarget(node.left as ESTree.Pattern, key);
        }

        this.checkLimits(line);
        this.emitStep(line, "ForInStatement");

        const result = this.execStatement(node.body as ESTree.Statement);
        if (result === BREAK_SIGNAL) break;
        if (result instanceof ReturnSignal) return result;
      }
    } finally {
      this.scope = prevScope;
    }
    return undefined;
  }

  private execForOfStatement(node: ESTree.ForOfStatement, line: number): unknown {
    const iterable = this.evalExpression(node.right);
    const items = iterable instanceof Set ? [...iterable]
      : iterable instanceof Map ? [...iterable]
      : (iterable as unknown[]);

    if (!Array.isArray(items) && !(iterable != null && typeof (iterable as Iterable<unknown>)[Symbol.iterator] === "function")) {
      throw new TypeError(`${typeof iterable} is not iterable`);
    }

    const blockScope = this.scope.child();
    const prevScope = this.scope;
    this.scope = blockScope;

    try {
      for (const item of (items ?? []) as Iterable<unknown>) {
        if (node.left.type === "VariableDeclaration") {
          const decl = node.left.declarations[0]!;
          const leftKind = node.left.kind === "var" ? "var" as const : node.left.kind === "const" ? "const" as const : "let" as const;
          this.declarePattern(decl.id, item, leftKind);
        } else {
          this.assignTarget(node.left as ESTree.Pattern, item);
        }

        this.checkLimits(line);
        this.emitStep(line, "ForOfStatement");

        const result = this.execStatement(node.body as ESTree.Statement);
        if (result === BREAK_SIGNAL) break;
        if (result instanceof ReturnSignal) return result;
      }
    } finally {
      this.scope = prevScope;
    }
    return undefined;
  }

  private execBlock(node: ESTree.BlockStatement): unknown {
    const blockScope = this.scope.child();
    const prevScope = this.scope;
    this.scope = blockScope;
    try {
      for (const stmt of node.body) {
        const result = this.execStatement(stmt);
        if (result === BREAK_SIGNAL || result === CONTINUE_SIGNAL || result instanceof ReturnSignal) {
          return result;
        }
      }
    } finally {
      this.scope = prevScope;
    }
    return undefined;
  }

  private execSwitchStatement(node: ESTree.SwitchStatement, line: number): unknown {
    const discriminant = this.evalExpression(node.discriminant);
    this.checkLimits(line);

    let matched = false;
    for (const caseClause of node.cases) {
      if (!matched) {
        if (!caseClause.test) {
          matched = true;
        } else {
          matched = this.evalExpression(caseClause.test) === discriminant;
        }
      }
      if (matched) {
        for (const stmt of caseClause.consequent) {
          const result = this.execStatement(stmt);
          if (result === BREAK_SIGNAL) return undefined;
          if (result instanceof ReturnSignal) return result;
        }
      }
    }
    return undefined;
  }

  /* ======================== Expressions =================================== */

  private evalExpression(node: ESTree.Expression | ESTree.SpreadElement): unknown {
    switch (node.type) {
      case "Literal":
        return node.value;
      case "Identifier":
        return this.scope.get(node.name);
      case "BinaryExpression":
        return this.evalBinary(node);
      case "LogicalExpression":
        return this.evalLogical(node);
      case "UnaryExpression":
        return this.evalUnary(node);
      case "UpdateExpression":
        return this.evalUpdate(node);
      case "AssignmentExpression":
        return this.evalAssignment(node);
      case "MemberExpression":
        return this.evalMember(node);
      case "CallExpression":
        return this.evalCall(node);
      case "NewExpression":
        return this.evalNew(node);
      case "ArrayExpression":
        return this.evalArrayExpression(node);
      case "ObjectExpression":
        return this.evalObjectExpression(node);
      case "ConditionalExpression":
        return this.evalExpression(node.test)
          ? this.evalExpression(node.consequent)
          : this.evalExpression(node.alternate);
      case "ArrowFunctionExpression":
      case "FunctionExpression":
        return node;
      case "ChainExpression":
        return this.evalExpression((node as unknown as { expression: ESTree.Expression }).expression);
      case "TemplateLiteral":
        return this.evalTemplateLiteral(node);
      case "SpreadElement":
        return this.evalExpression(node.argument);
      case "ThisExpression":
        return this.scope.has("this") ? this.scope.get("this") : undefined;
      default:
        return undefined;
    }
  }

  private evalBinary(node: ESTree.BinaryExpression): unknown {
    const left = this.evalExpression(node.left as ESTree.Expression) as number;
    const right = this.evalExpression(node.right as ESTree.Expression) as number;

    switch (node.operator) {
      case "+": return typeof left === "string" || typeof right === "string" ? String(left) + String(right) : (left as number) + (right as number);
      case "-": return (left as number) - (right as number);
      case "*": return (left as number) * (right as number);
      case "/": return (left as number) / (right as number);
      case "%": return (left as number) % (right as number);
      case "**": return (left as number) ** (right as number);
      case "==": return left == right;
      case "!=": return left != right;
      case "===": return left === right;
      case "!==": return left !== right;
      case "<": return (left as number) < (right as number);
      case ">": return (left as number) > (right as number);
      case "<=": return (left as number) <= (right as number);
      case ">=": return (left as number) >= (right as number);
      case "&": return (left as number) & (right as number);
      case "|": return (left as number) | (right as number);
      case "^": return (left as number) ^ (right as number);
      case "<<": return (left as number) << (right as number);
      case ">>": return (left as number) >> (right as number);
      case ">>>": return (left as number) >>> (right as number);
      default: return undefined;
    }
  }

  private evalLogical(node: ESTree.LogicalExpression): unknown {
    const left = this.evalExpression(node.left);
    switch (node.operator) {
      case "&&": return left ? this.evalExpression(node.right) : left;
      case "||": return left ? left : this.evalExpression(node.right);
      case "??": return left != null ? left : this.evalExpression(node.right);
      default: return undefined;
    }
  }

  private evalUnary(node: ESTree.UnaryExpression): unknown {
    if (node.operator === "typeof") {
      if (node.argument.type === "Identifier") {
        try { return typeof this.scope.get(node.argument.name); } catch { return "undefined"; }
      }
      return typeof this.evalExpression(node.argument);
    }
    const val = this.evalExpression(node.argument);
    switch (node.operator) {
      case "-": return -(val as number);
      case "+": return +(val as number);
      case "!": return !val;
      case "~": return ~(val as number);
      default: return undefined;
    }
  }

  private evalUpdate(node: ESTree.UpdateExpression): unknown {
    if (node.argument.type === "Identifier") {
      const old = (this.scope.get(node.argument.name) as number) ?? 0;
      const newVal = node.operator === "++" ? old + 1 : old - 1;
      this.scope.set(node.argument.name, newVal);
      return node.prefix ? newVal : old;
    }
    if (node.argument.type === "MemberExpression") {
      const { obj, key } = this.resolveMember(node.argument);
      const old = ((obj as Record<string, unknown>)[key as string] as number) ?? 0;
      const newVal = node.operator === "++" ? old + 1 : old - 1;
      (obj as Record<string, unknown>)[key as string] = newVal;
      return node.prefix ? newVal : old;
    }
    return undefined;
  }

  private evalAssignment(node: ESTree.AssignmentExpression): unknown {
    const value = this.evalExpression(node.right);

    if (node.operator !== "=") {
      const current = this.evalExpressionAsLValue(node.left) as number;
      const computed = this.computeCompound(node.operator, current, value as number);
      this.assignTarget(node.left as ESTree.Pattern, computed);
      return computed;
    }

    this.assignTarget(node.left as ESTree.Pattern, value);
    return value;
  }

  private computeCompound(op: string, left: number, right: number): unknown {
    switch (op) {
      case "+=": return typeof left === "string" ? String(left) + String(right) : (left ?? 0) + right;
      case "-=": return (left ?? 0) - right;
      case "*=": return (left ?? 0) * right;
      case "/=": return (left ?? 0) / right;
      case "%=": return (left ?? 0) % right;
      default: return right;
    }
  }

  private evalExpressionAsLValue(node: ESTree.Expression | ESTree.Pattern): unknown {
    if (node.type === "Identifier") {
      try { return this.scope.get(node.name); } catch { return 0; }
    }
    if (node.type === "MemberExpression") return this.evalMember(node);
    return undefined;
  }

  private assignTarget(pattern: ESTree.Pattern, value: unknown): void {
    switch (pattern.type) {
      case "Identifier":
        this.scope.set(pattern.name, value);
        break;
      case "MemberExpression": {
        const { obj, key } = this.resolveMember(pattern as ESTree.MemberExpression);
        (obj as Record<string | number, unknown>)[key as string | number] = value;
        break;
      }
      case "ArrayPattern":
        if (Array.isArray(value)) {
          for (let i = 0; i < pattern.elements.length; i++) {
            const elem = pattern.elements[i];
            if (elem) this.assignTarget(elem, value[i]);
          }
        }
        break;
    }
  }

  private resolveMember(node: ESTree.MemberExpression): { obj: unknown; key: unknown } {
    const obj = this.evalExpression(node.object as ESTree.Expression);
    const key = node.computed
      ? this.evalExpression(node.property as ESTree.Expression)
      : (node.property as ESTree.Identifier).name;
    return { obj, key };
  }

  private evalMember(node: ESTree.MemberExpression): unknown {
    const { obj, key } = this.resolveMember(node);

    if (obj === null || obj === undefined) {
      throw new TypeError(`Cannot read properties of ${obj} (reading '${String(key)}')`);
    }

    const value = (obj as Record<string | number, unknown>)[key as string | number];
    if (typeof value === "function") {
      return value.bind(obj);
    }
    return value;
  }

  /**
   * Wrap an AST function into a callable JavaScript function so it works
   * when passed to native higher-order methods like Array.from, map, filter, reduce.
   */
  private wrapCallback(arg: unknown): unknown {
    if (arg && typeof arg === "object" && "type" in (arg as Record<string, unknown>)) {
      const fnNode = arg as ESTree.FunctionExpression | ESTree.ArrowFunctionExpression;
      if (fnNode.type === "FunctionExpression" || fnNode.type === "ArrowFunctionExpression") {
        return (...cbArgs: unknown[]) => this.callFunction(fnNode, cbArgs, "callback");
      }
    }
    return arg;
  }

  private evalCall(node: ESTree.CallExpression): unknown {
    const callee = node.callee;
    const rawArgs = this.evalArgs(node.arguments as (ESTree.Expression | ESTree.SpreadElement)[]);
    const args = rawArgs.map((a) => this.wrapCallback(a));

    // Handle method calls: obj.method()
    if (callee.type === "MemberExpression") {
      const { obj, key } = this.resolveMember(callee);
      const methodName = String(key);

      // User function on object
      if (obj && typeof obj === "object") {
        const val = (obj as Record<string, unknown>)[methodName];
        if (typeof val === "function") {
          return (val as Function).apply(obj, args);
        }
      }

      // Built-in method
      if (obj === null || obj === undefined) {
        throw new TypeError(`Cannot read properties of ${obj} (reading '${methodName}')`);
      }

      const method = (obj as Record<string, unknown>)[methodName];
      if (typeof method === "function") {
        return (method as Function).apply(obj, args);
      }

      throw new TypeError(`${methodName} is not a function`);
    }

    // Handle direct function calls: func(...)
    if (callee.type === "Identifier") {
      const fn = this.userFunctions.get(callee.name);
      if (fn) {
        return this.callFunction(fn, args, callee.name);
      }

      let scopeVal: unknown;
      try {
        scopeVal = this.scope.get(callee.name);
      } catch {
        // not found
      }

      if (scopeVal && typeof scopeVal === "object" && "type" in (scopeVal as Record<string, unknown>)) {
        const fnNode = scopeVal as ESTree.FunctionDeclaration | ESTree.FunctionExpression;
        return this.callFunction(fnNode, args, callee.name);
      }

      if (typeof scopeVal === "function") {
        return (scopeVal as Function)(...args);
      }

      throw new TypeError(`${callee.name} is not a function`);
    }

    // Expression call
    const fn = this.evalExpression(callee as ESTree.Expression);
    if (fn && typeof fn === "object" && "type" in (fn as Record<string, unknown>)) {
      return this.callFunction(fn as ESTree.FunctionExpression, args, "anonymous");
    }
    if (typeof fn === "function") {
      return (fn as Function)(...args);
    }

    throw new TypeError("Not a function");
  }

  private evalNew(node: ESTree.NewExpression): unknown {
    const calleeFn = this.evalExpression(node.callee as ESTree.Expression);
    const rawArgs = this.evalArgs(node.arguments as (ESTree.Expression | ESTree.SpreadElement)[]);
    const args = rawArgs.map((a) => this.wrapCallback(a));

    if (calleeFn === Array) return new Array(...(args as [number]));
    if (calleeFn === Set) return new Set(args[0] as Iterable<unknown>);
    if (calleeFn === Map) return new Map(args[0] as Iterable<[unknown, unknown]>);

    if (typeof calleeFn === "function") {
      return new (calleeFn as new (...a: unknown[]) => unknown)(...args);
    }
    return {};
  }

  private evalArgs(args: (ESTree.Expression | ESTree.SpreadElement)[]): unknown[] {
    const result: unknown[] = [];
    for (const arg of args) {
      if (arg.type === "SpreadElement") {
        const spread = this.evalExpression(arg.argument);
        if (Array.isArray(spread)) result.push(...spread);
        else if (spread instanceof Set) result.push(...spread);
        else result.push(spread);
      } else {
        result.push(this.evalExpression(arg));
      }
    }
    return result;
  }

  private evalArrayExpression(node: ESTree.ArrayExpression): unknown[] {
    const result: unknown[] = [];
    for (const elem of node.elements) {
      if (elem === null) {
        result.push(undefined);
      } else if (elem.type === "SpreadElement") {
        const spread = this.evalExpression(elem.argument);
        if (Array.isArray(spread)) result.push(...spread);
        else result.push(spread);
      } else {
        result.push(this.evalExpression(elem));
      }
    }
    return result;
  }

  private evalObjectExpression(node: ESTree.ObjectExpression): Record<string, unknown> {
    const obj: Record<string, unknown> = {};
    for (const prop of node.properties) {
      if (prop.type === "SpreadElement") {
        Object.assign(obj, this.evalExpression(prop.argument));
      } else {
        const key = prop.key.type === "Identifier"
          ? prop.key.name
          : String(this.evalExpression(prop.key as ESTree.Expression));
        obj[key] = this.evalExpression(prop.value as ESTree.Expression);
      }
    }
    return obj;
  }

  private evalTemplateLiteral(node: ESTree.TemplateLiteral): string {
    let result = "";
    for (let i = 0; i < node.quasis.length; i++) {
      result += node.quasis[i]!.value.cooked ?? node.quasis[i]!.value.raw;
      if (i < node.expressions.length) {
        result += String(this.evalExpression(node.expressions[i]!));
      }
    }
    return result;
  }

  /* =========================== Function calls ============================ */

  callFunction(
    fn: ESTree.FunctionDeclaration | ESTree.FunctionExpression | ESTree.ArrowFunctionExpression,
    args: unknown[],
    name: string,
    thisContext?: Record<string, unknown>,
  ): unknown {
    const callId = `call-${this.callIdCounter++}`;

    const frame: CallFrame = {
      id: callId,
      label: `${name}(${args.map(formatArgShort).join(", ")})`,
      depth: this.callstack.length,
      parentId: this.callstack.length ? this.callstack[this.callstack.length - 1]!.id : null,
      status: "active",
    };

    for (const f of this.callstack) {
      if (f.status === "active") f.status = "pending";
    }
    this.callstack.push(frame);

    const line = this.getLine(fn as unknown as ESTree.Node);
    this.checkLimits(line);
    this.emitStep(line, "CallExpression", `${name}(…)`);

    const fnScope = this.scope.childFunction();
    const prevScope = this.scope;
    this.scope = fnScope;

    // Bind `this` context
    if (thisContext) {
      fnScope.define("this", thisContext);
    } else if (this.classInstances.size > 0) {
      fnScope.define("this", this.classInstances.values().next().value);
    }

    try {
      for (let i = 0; i < fn.params.length; i++) {
        const param = fn.params[i]!;
        if (param.type === "Identifier") {
          fnScope.define(param.name, args[i]);
        } else if (param.type === "AssignmentPattern" && param.left.type === "Identifier") {
          fnScope.define(param.left.name, args[i] !== undefined ? args[i] : this.evalExpression(param.right));
        } else if (param.type === "RestElement" && param.argument.type === "Identifier") {
          fnScope.define(param.argument.name, args.slice(i));
        }
      }

      let result: unknown;
      const body = fn.body;

      if (body.type === "BlockStatement") {
        for (const stmt of body.body) {
          const r = this.execStatement(stmt);
          if (r instanceof ReturnSignal) {
            result = r.value;
            break;
          }
          if (r === BREAK_SIGNAL || r === CONTINUE_SIGNAL) break;
        }
      } else {
        result = this.evalExpression(body as unknown as ESTree.Expression);
        const retLine = this.getLine(body as unknown as ESTree.Node);
        this.checkLimits(retLine);
        this.emitStep(retLine, "ReturnStatement", this.getSourceText(body as unknown as ESTree.Node));
      }

      frame.status = "returned";
      frame.returnValue = typeof result === "number" ? result : undefined;

      for (let i = this.callstack.length - 2; i >= 0; i--) {
        if (this.callstack[i]!.status === "pending") {
          this.callstack[i]!.status = "active";
          break;
        }
      }

      this.checkLimits(line);
      this.emitStep(line, "ReturnStatement", `return ${formatArgShort(result)}`);

      return result;
    } finally {
      this.scope = prevScope;
    }
  }
}

/* ============================== Helpers ================================== */

function formatArgShort(value: unknown): string {
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "string") return value.length > 20 ? `"${value.slice(0, 17)}…"` : `"${value}"`;
  if (Array.isArray(value)) {
    if (value.length <= 5) return `[${value.map(formatArgShort).join(",")}]`;
    return `[${value.slice(0, 3).map(formatArgShort).join(",")},…(${value.length})]`;
  }
  return "{…}";
}

export function interpret(config: InterpreterConfig): InterpreterResult {
  const interpreter = new Interpreter(config);
  return interpreter.run(config);
}
