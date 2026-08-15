/**
 * Engine public API
 */

import type { ExecutionEvent } from "@/types/execution";
import type { SupportedLanguage } from "@/types/languages";
import { transpileToJS } from "./transpiler";
import { analyzeCode, type DetectedFunction, type DetectedParam, type InferredType } from "./functionDetector";
import { executeCodeWithTimeout } from "./worker";
import type { InterpreterResult } from "./interpreter";

export type RunCodeResult = {
  events: ExecutionEvent[];
  returnValue: unknown;
  error: { line: number; message: string } | null;
  totalSteps: number;
  executionTimeMs: number;
  logs: unknown[][];
  detectedFunction: DetectedFunction | null;
};

export async function runCode(
  code: string,
  language: SupportedLanguage,
  inputValues: Record<string, unknown>,
  options?: {
    entryFunction?: string;
    maxSteps?: number;
    timeoutMs?: number;
  },
): Promise<RunCodeResult> {
  // 1. Transpile to JavaScript
  const jsCode = transpileToJS(code, language);

  // 2. Detect functions and entry point
  const { entryFunction } = analyzeCode(code, language);
  const targetFunction = options?.entryFunction ?? entryFunction?.name;

  // 3. Execute
  const result: InterpreterResult = await executeCodeWithTimeout(
    {
      code: jsCode,
      args: inputValues,
      entryFunction: targetFunction,
      maxSteps: options?.maxSteps ?? 10_000,
      timeoutMs: options?.timeoutMs ?? 5_000,
    },
    options?.timeoutMs ?? 5_000,
  );

  return {
    ...result,
    detectedFunction: entryFunction,
  };
}

export { analyzeCode };
export type { DetectedFunction, DetectedParam, InferredType };
export type { InterpreterResult };
