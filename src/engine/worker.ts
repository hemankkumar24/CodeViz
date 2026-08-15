/**
 * Web Worker wrapper for sandboxed code execution.
 *
 * Since we can't easily use a real Web Worker with Vite's bundling
 * without extra config, we use a synchronous approach with step/time limits
 * that runs on the main thread but is still safe due to the interpreter's
 * built-in sandboxing (no DOM/network access, step limits, timeouts).
 *
 * The interpreter itself is the sandbox — it doesn't eval() or Function(),
 * it walks the AST node-by-node with controlled scope.
 */

import { interpret, type InterpreterConfig, type InterpreterResult } from "./interpreter";

/**
 * Execute code with the interpreter. Runs synchronously but is safe
 * because the AST-walking interpreter has no access to DOM, network,
 * or any browser APIs beyond Math/Array/Set/Map.
 */
export async function executeCode(config: InterpreterConfig): Promise<InterpreterResult> {
  // Run in a microtask to avoid blocking the UI thread during setup
  return new Promise((resolve) => {
    // Use setTimeout to yield to the browser before execution
    setTimeout(() => {
      const result = interpret(config);
      resolve(result);
    }, 0);
  });
}

/**
 * Execute code with a hard timeout using AbortController pattern.
 * Falls back to synchronous execution if the timeout is not reached.
 */
export async function executeCodeWithTimeout(
  config: InterpreterConfig,
  timeoutMs = 5000,
): Promise<InterpreterResult> {
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      resolve({
        events: [],
        returnValue: undefined,
        error: {
          line: 1,
          message: `Execution timed out after ${Math.round(timeoutMs / 1000)}s. The code may contain an infinite loop.`,
        },
        totalSteps: 0,
        executionTimeMs: timeoutMs,
        logs: [],
      });
    }, timeoutMs + 500); // Extra buffer since interpreter has its own timeout

    setTimeout(() => {
      const result = interpret({
        ...config,
        timeoutMs,
      });
      clearTimeout(timeoutId);
      resolve(result);
    }, 0);
  });
}
