/**
 * Analyzes user code to auto-detect:
 * - Entry function (the main function to call)
 * - Parameter names and inferred types
 */

import * as acorn from "acorn";
import type * as ESTree from "estree";
import { transpileToJS } from "./transpiler";
import type { SupportedLanguage } from "@/types/languages";

/* ------------------------------ Types ------------------------------------ */

export type InferredType =
  | "number"
  | "number[]"
  | "number[][]"
  | "string"
  | "string[]"
  | "boolean"
  | "unknown";

export type DetectedParam = {
  name: string;
  inferredType: InferredType;
  defaultValue?: unknown;
};

export type DetectedFunction = {
  name: string;
  params: DetectedParam[];
  isClassMethod: boolean;
  className?: string;
};

/* ---------------------- Type inference ----------------------------------- */

function inferParamType(name: string): InferredType {
  const lower = name.toLowerCase();

  if (
    ["grid", "matrix", "board", "graph", "adjlist", "adj", "adjacency", "dp", "table", "memo"].includes(lower)
  ) {
    return "number[][]";
  }

  if (
    ["nums", "arr", "array", "values", "weights", "prices", "coins", "stones",
     "cards", "heights", "intervals", "points", "edges", "nodes", "data",
     "list", "items", "elements", "result", "order", "queue", "seen", "visited"].includes(lower)
  ) {
    return "number[]";
  }

  if (
    ["n", "m", "k", "target", "capacity", "val", "value", "sum", "limit",
     "size", "count", "start", "end", "x", "y", "num", "amount", "goal",
     "max", "min", "threshold", "depth", "level", "index", "node",
     "maxsteps", "multiplier", "score", "steps", "diff", "mindiff", "maxdiff",
     "len", "length", "pos", "offset", "radius", "speed", "total"].includes(lower)
  ) {
    return "number";
  }

  if (
    ["s", "t", "str", "word", "text", "pattern", "prefix", "suffix", "key", "name", "char", "letter"].includes(lower)
  ) {
    return "string";
  }

  return "unknown";
}

/* -------------------- Function detection --------------------------------- */

export function detectFunctions(jsCode: string): DetectedFunction[] {
  const functions: DetectedFunction[] = [];

  try {
    const ast = acorn.parse(jsCode, {
      ecmaVersion: 2022,
      sourceType: "script",
      locations: true,
    }) as unknown as ESTree.Program;

    for (const node of ast.body) {
      if (node.type === "FunctionDeclaration" && node.id) {
        functions.push({
          name: node.id.name,
          params: extractParams(node.params),
          isClassMethod: false,
        });
      } else if (node.type === "VariableDeclaration") {
        for (const decl of node.declarations) {
          if (
            decl.id.type === "Identifier" &&
            decl.init &&
            (decl.init.type === "FunctionExpression" || decl.init.type === "ArrowFunctionExpression")
          ) {
            functions.push({
              name: decl.id.name,
              params: extractParams(decl.init.params),
              isClassMethod: false,
            });
          }
        }
      } else if (node.type === "ClassDeclaration") {
        const className = node.id?.name ?? "Solution";
        for (const item of node.body.body) {
          if (item.type === "MethodDefinition" && item.key.type === "Identifier" && item.key.name !== "constructor") {
            functions.push({
              name: item.key.name,
              params: extractParams(item.value.params),
              isClassMethod: true,
              className,
            });
          }
        }
      }
    }
  } catch {
    return detectFunctionsRegex(jsCode);
  }

  return functions;
}

function extractParams(params: ESTree.Pattern[]): DetectedParam[] {
  const result: DetectedParam[] = [];
  for (const param of params) {
    if (param.type === "Identifier") {
      if (param.name !== "self" && param.name !== "this") {
        result.push({
          name: param.name,
          inferredType: inferParamType(param.name),
        });
      }
    } else if (param.type === "AssignmentPattern" && param.left.type === "Identifier") {
      if (param.left.name !== "self" && param.left.name !== "this") {
        result.push({
          name: param.left.name,
          inferredType: inferParamType(param.left.name),
          defaultValue: param.right.type === "Literal" ? (param.right as ESTree.Literal).value : undefined,
        });
      }
    }
  }
  return result;
}

function detectFunctionsRegex(code: string): DetectedFunction[] {
  const functions: DetectedFunction[] = [];
  const fnRegex = /(?:function\s+(\w+)|(\w+)\s*\(([^)]*)\)\s*\{)/g;
  let match;
  while ((match = fnRegex.exec(code)) !== null) {
    const name = match[1] ?? match[2];
    if (name && name !== "if" && name !== "while" && name !== "for" && name !== "switch" && name !== "catch") {
      const rawParams = match[3] ?? "";
      const params = rawParams.split(",").map((p) => p.trim()).filter((p) => p && p !== "self" && p !== "this").map((p) => ({
        name: p.replace(/[=:][\s\S]*/, "").trim(),
        inferredType: inferParamType(p),
      }));
      functions.push({
        name,
        params,
        isClassMethod: false,
      });
    }
  }
  return functions;
}

export function selectEntryFunction(functions: DetectedFunction[]): DetectedFunction | null {
  if (functions.length === 0) return null;
  if (functions.length === 1) return functions[0]!;

  const nonHelpers = functions.filter((f) => !f.name.startsWith("_") && !f.name.startsWith("#") && !f.name.toLowerCase().includes("util") && f.name !== "helper");
  if (nonHelpers.length > 0) {
    const methods = nonHelpers.filter((f) => f.isClassMethod);
    if (methods.length > 0) return methods[0]!;
    return nonHelpers[0]!;
  }

  return functions[0]!;
}

export function analyzeCode(code: string, language: SupportedLanguage): {
  functions: DetectedFunction[];
  entryFunction: DetectedFunction | null;
} {
  const jsCode = transpileToJS(code, language);
  const functions = detectFunctions(jsCode);
  const entryFunction = selectEntryFunction(functions);
  return { functions, entryFunction };
}
