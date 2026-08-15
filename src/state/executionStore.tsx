import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type {
  ExecutionEvent,
  ExecutionStatus,
  InputData,
  PlaybackSpeed,
  VisualizationType,
} from "@/types/execution";
import type { SupportedLanguage } from "@/types/languages";
import { getExample, getExampleCode, type Example } from "@/data/examples";
import { runCode, analyzeCode, type DetectedFunction, type DetectedParam, type InferredType } from "@/engine";
import { selectMutationSteps, selectVisualizationState } from "./selectors";

/* ------------------------------ input parsing ----------------------------- */

export type ParsedInput =
  | { ok: true; data: InputData; summary: string }
  | { ok: false; message: string };

export function parseSingleParamValue(
  raw: string,
  type: InferredType,
): { ok: true; value: unknown } | { ok: false; message: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, message: "Value is required" };
  }

  if (type === "number") {
    const n = Number(trimmed);
    if (isNaN(n)) return { ok: false, message: `Expected a number, found "${trimmed}"` };
    return { ok: true, value: n };
  }

  if (type === "number[]") {
    if (trimmed.startsWith("new Set")) {
      return { ok: true, value: new Set() };
    }
    if (trimmed.startsWith("[")) {
      try {
        const arr = JSON.parse(trimmed);
        if (!Array.isArray(arr)) return { ok: false, message: "Expected an array" };
        return { ok: true, value: arr };
      } catch {
        // Fallback comma-split
      }
    }
    const clean = trimmed.replace(/^\[|\]$/g, "");
    const parts = clean.split(/[\s,]+/).filter(Boolean);
    const nums: number[] = [];
    for (let i = 0; i < parts.length; i++) {
      const n = Number(parts[i]);
      if (isNaN(n)) return { ok: false, message: `Invalid number "${parts[i]}" at index ${i}` };
      nums.push(n);
    }
    return { ok: true, value: nums };
  }

  if (type === "number[][]") {
    if (trimmed.startsWith("[")) {
      try {
        const matrix = JSON.parse(trimmed);
        if (!Array.isArray(matrix)) return { ok: false, message: "Expected a 2D array" };
        return { ok: true, value: matrix };
      } catch {
        // Fallback row-split
      }
    }
    const rows = trimmed
      .replace(/^\[|\]$/g, "")
      .split(/\]\s*,?\s*\[|\n/)
      .map((r) => r.replace(/[[\]]/g, "").trim())
      .filter(Boolean);
    const matrix: number[][] = [];
    for (const row of rows) {
      const cells = row.split(/[\s,]+/).filter(Boolean);
      const parsedRow: number[] = [];
      for (const cell of cells) {
        const n = Number(cell);
        if (isNaN(n)) return { ok: false, message: `Invalid number "${cell}" in matrix` };
        parsedRow.push(n);
      }
      matrix.push(parsedRow);
    }
    return { ok: true, value: matrix };
  }

  if (type === "boolean") {
    if (trimmed === "true") return { ok: true, value: true };
    if (trimmed === "false") return { ok: true, value: false };
    return { ok: false, message: "Expected true or false" };
  }

  if (type === "string") {
    const unquoted = trimmed.replace(/^["']|["']$/g, "");
    return { ok: true, value: unquoted };
  }

  if (trimmed.startsWith("new Set")) {
    return { ok: true, value: new Set() };
  }

  try {
    return { ok: true, value: JSON.parse(trimmed) };
  } catch {
    const n = Number(trimmed);
    if (!isNaN(n)) return { ok: true, value: n };
    return { ok: true, value: trimmed };
  }
}

export function getDefaultParamValue(name: string, type: InferredType, codeDefault?: unknown): string {
  if (codeDefault !== undefined) {
    return typeof codeDefault === "object" ? JSON.stringify(codeDefault) : String(codeDefault);
  }
  if (type === "number[]") return "e.g. [1, 2, 3]";
  if (type === "number[][]") return "e.g. [[1, 2], [3, 4]]";
  if (type === "number") return "e.g. 5";
  if (type === "string") return 'e.g. "text"';
  if (type === "boolean") return "true";
  return "e.g. 0";
}

export function parseInput(raw: string, kind: InputData["kind"]): ParsedInput {
  const text = raw.trim();
  if (!text) return { ok: false, message: "Input is empty." };

  if (kind === "variables") {
    const entries: Record<string, unknown> = {};
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    
    for (const line of lines) {
      const eqIdx = line.indexOf("=");
      const colonIdx = line.indexOf(":");
      const splitIdx = eqIdx !== -1 ? eqIdx : colonIdx;
      
      if (splitIdx === -1) {
        return { ok: false, message: `Expected \`name = value\`, found \`${line}\`.` };
      }
      
      const key = line.slice(0, splitIdx).trim();
      const valStr = line.slice(splitIdx + 1).trim();
      
      if (!/^[A-Za-z_]\w*$/.test(key)) {
        return { ok: false, message: `Invalid variable name \`${key}\`.` };
      }
      
      if (valStr.startsWith("[")) {
        try {
          const parsed = JSON.parse(valStr);
          entries[key] = parsed;
          continue;
        } catch {
          const rawItems = valStr.replace(/^\[|\]$/g, "").split(",").map((s) => Number(s.trim()));
          if (rawItems.some(isNaN)) {
            return { ok: false, message: `Could not parse array value \`${valStr}\`.` };
          }
          entries[key] = rawItems;
          continue;
        }
      }
      
      const num = Number(valStr);
      if (!isNaN(num)) {
        entries[key] = num;
      } else if (valStr === "true" || valStr === "false") {
        entries[key] = valStr === "true";
      } else {
        entries[key] = valStr;
      }
    }
    
    const count = Object.keys(entries).length;
    if (!count) return { ok: false, message: "No variables found." };
    return { ok: true, data: { kind: "variables", values: entries }, summary: `${count} variable${count === 1 ? "" : "s"} detected` };
  }

  if (kind === "matrix") {
    const rows = text
      .replace(/^\[|\]$/g, "")
      .split(/\]\s*,?\s*\[|\n/)
      .map((r) => r.replace(/[[\]]/g, "").trim())
      .filter(Boolean);
    const values: number[][] = [];
    for (const row of rows) {
      const cells = row.split(/[\s,]+/).filter(Boolean);
      const parsed: number[] = [];
      for (let i = 0; i < cells.length; i++) {
        const n = Number(cells[i]);
        if (Number.isNaN(n))
          return { ok: false, message: `Expected a number, found \`${cells[i]}\` in row ${values.length + 1}.` };
        parsed.push(n);
      }
      values.push(parsed);
    }
    const width = values[0]?.length ?? 0;
    if (!values.length || !width) return { ok: false, message: "No matrix rows found." };
    return { ok: true, data: { kind: "matrix", values }, summary: `${values.length} rows detected` };
  }

  const cells = text.replace(/[[\]]/g, "").split(/[\s,]+/).filter(Boolean);
  const values: number[] = [];
  for (let i = 0; i < cells.length; i++) {
    const n = Number(cells[i]);
    if (Number.isNaN(n))
      return { ok: false, message: `Expected a numeric array, found \`${cells[i]}\` at index ${i}.` };
    values.push(n);
  }
  if (!values.length) return { ok: false, message: "No elements found." };
  return {
    ok: true,
    data: { kind: "array", values },
    summary: `${values.length} element${values.length === 1 ? "" : "s"} detected`,
  };
}

/* --------------------------------- state ---------------------------------- */

export type InternalExecutionEvent = ExecutionEvent & {
  rawLine?: number;
};

type State = {
  title: string;
  exampleSlug: string | null;
  language: SupportedLanguage;
  code: string;
  inputMode: "form" | "raw";
  inputKind: InputData["kind"];
  inputText: string;
  paramValues: Record<string, string>;
  visualizationType: VisualizationType;
  selectedVariable: string | null;
  dpDimensions: "1D" | "2D";
  multiSelection: string[];
  events: InternalExecutionEvent[];
  currentStep: number;
  isPlaying: boolean;
  speed: PlaybackSpeed;
  hasRun: boolean;
  isExecuting: boolean;
  executionTimeMs: number | null;
  consoleLogs: unknown[][];
  detectedFunction: DetectedFunction | null;
  detectedParams: DetectedParam[];
  error: { line: number; message: string } | null;
};

const initialState: State = {
  title: "Untitled",
  exampleSlug: null,
  language: "cpp",
  code: "",
  inputMode: "form",
  inputKind: "variables",
  inputText: "",
  paramValues: {},
  visualizationType: "auto",
  selectedVariable: null,
  dpDimensions: "1D",
  multiSelection: [],
  events: [],
  currentStep: 0,
  isPlaying: false,
  speed: 1,
  hasRun: false,
  isExecuting: false,
  executionTimeMs: null,
  consoleLogs: [],
  detectedFunction: null,
  detectedParams: [],
  error: null,
};

type Action =
  | { type: "setTitle"; title: string }
  | { type: "setLanguage"; language: SupportedLanguage }
  | { type: "setCode"; code: string }
  | { type: "setInputMode"; mode: "form" | "raw" }
  | { type: "setInputKind"; kind: InputData["kind"] }
  | { type: "setInputText"; text: string }
  | { type: "setParamValue"; name: string; value: string }
  | { type: "setParamValues"; values: Record<string, string> }
  | { type: "setVisualizationType"; value: VisualizationType }
  | { type: "setSelectedVariable"; value: string | null }
  | { type: "setDpDimensions"; value: "1D" | "2D" }
  | { type: "toggleMulti"; value: string }
  | { type: "loadExample"; example: Example }
  | { type: "setExecuting" }
  | { type: "run"; events: InternalExecutionEvent[]; error: State["error"]; executionTimeMs?: number; logs?: unknown[][] }
  | { type: "setDetectedFunction"; fn: DetectedFunction | null; params: DetectedParam[] }
  | { type: "play" }
  | { type: "pause" }
  | { type: "goto"; step: number }
  | { type: "stepForward" }
  | { type: "stepBack" }
  | { type: "restart" }
  | { type: "setSpeed"; speed: PlaybackSpeed }
  | { type: "clearEditor" }
  | { type: "reset" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "setTitle":
      return { ...state, title: action.title };
    case "setLanguage": {
      const nextLang = action.language;
      let nextCode = state.code;
      if (state.exampleSlug) {
        const ex = getExample(state.exampleSlug);
        if (ex) {
          nextCode = getExampleCode(ex, nextLang);
        }
      }
      return {
        ...state,
        language: nextLang,
        code: nextCode,
        events: [],
        hasRun: false,
        isPlaying: false,
        currentStep: 0,
      };
    }
    case "setCode":
      return { ...state, code: action.code, events: [], hasRun: false, isPlaying: false, currentStep: 0, error: null };
    case "setInputMode":
      return { ...state, inputMode: action.mode };
    case "setInputKind":
      return { ...state, inputKind: action.kind, events: [], hasRun: false, isPlaying: false, error: null };
    case "setInputText":
      return { ...state, inputText: action.text, events: [], hasRun: false, isPlaying: false, currentStep: 0, error: null };
    case "setParamValue":
      return {
        ...state,
        paramValues: { ...state.paramValues, [action.name]: action.value },
        events: [],
        hasRun: false,
        isPlaying: false,
        currentStep: 0,
        error: null,
      };
    case "setParamValues":
      return { ...state, paramValues: action.values, error: null };
    case "setVisualizationType":
      return { ...state, visualizationType: action.value };
    case "setSelectedVariable":
      return { ...state, selectedVariable: action.value };
    case "setDpDimensions":
      return { ...state, dpDimensions: action.value };
    case "toggleMulti":
      return {
        ...state,
        multiSelection: state.multiSelection.includes(action.value)
          ? state.multiSelection.filter((v) => v !== action.value)
          : [...state.multiSelection, action.value],
      };
    case "loadExample": {
      const ex = action.example;
      const paramValues: Record<string, string> = {};
      if (ex.input.kind === "variables") {
        for (const [k, v] of Object.entries(ex.input.values)) {
          paramValues[k] = typeof v === "object" ? JSON.stringify(v) : String(v);
        }
      } else if (ex.input.kind === "array") {
        paramValues["nums"] = JSON.stringify(ex.input.values);
      } else if (ex.input.kind === "matrix") {
        paramValues["graph"] = JSON.stringify(ex.input.values);
      }

      const inputText =
        ex.input.kind === "array"
          ? `[${ex.input.values.join(", ")}]`
          : ex.input.kind === "matrix"
            ? ex.input.values.map((r) => `[${r.join(", ")}]`).join("\n")
            : Object.entries(ex.input.values)
                .map(([k, v]) => `${k} = ${typeof v === "object" ? JSON.stringify(v) : v}`)
                .join("\n");

      return {
        ...initialState,
        language: state.language,
        title: ex.title,
        exampleSlug: ex.slug,
        code: getExampleCode(ex, state.language),
        inputMode: "form",
        inputKind: ex.input.kind,
        inputText,
        paramValues,
        visualizationType: ex.visualizationType,
        selectedVariable: ex.targetVariable ?? null,
        dpDimensions: ex.slug === "knapsack" ? "2D" : "1D",
      };
    }
    case "setExecuting":
      return { ...state, isExecuting: true, error: null };
    case "run":
      return {
        ...state,
        events: action.events,
        error: action.error,
        currentStep: 0,
        hasRun: true,
        isPlaying: action.error ? false : true,
        isExecuting: false,
        executionTimeMs: action.executionTimeMs ?? null,
        consoleLogs: action.logs ?? [],
      };
    case "setDetectedFunction": {
      const updatedParams = { ...state.paramValues };
      for (const param of action.params) {
        if (!(param.name in updatedParams) || updatedParams[param.name] === undefined) {
          if (param.defaultValue !== undefined) {
            updatedParams[param.name] =
              typeof param.defaultValue === "object"
                ? JSON.stringify(param.defaultValue)
                : String(param.defaultValue);
          } else if (state.exampleSlug !== null) {
            updatedParams[param.name] = getDefaultParamValue(param.name, param.inferredType);
          } else {
            // For custom user code: leave empty so user types their own input
            updatedParams[param.name] = "";
          }
        }
      }
      return { ...state, detectedFunction: action.fn, detectedParams: action.params, paramValues: updatedParams };
    }
    case "play":
      return state.events.length ? { ...state, isPlaying: true } : state;
    case "pause":
      return { ...state, isPlaying: false };
    case "goto":
      return {
        ...state,
        currentStep: Math.min(Math.max(action.step, 0), Math.max(state.events.length - 1, 0)),
      };
    case "stepForward": {
      const next = Math.min(state.currentStep + 1, Math.max(state.events.length - 1, 0));
      return { ...state, currentStep: next, isPlaying: next === state.events.length - 1 ? false : state.isPlaying };
    }
    case "stepBack":
      return { ...state, currentStep: Math.max(state.currentStep - 1, 0), isPlaying: false };
    case "restart":
      return { ...state, currentStep: 0, isPlaying: false };
    case "setSpeed":
      return { ...state, speed: action.speed };
    case "clearEditor":
      return {
        ...initialState,
        title: "Untitled",
        exampleSlug: null,
        language: state.language,
        code: "",
        inputText: "",
        paramValues: {},
        events: [],
        hasRun: false,
        isPlaying: false,
        currentStep: 0,
        error: null,
        detectedFunction: null,
        detectedParams: [],
      };
    case "reset":
      return initialState;
    default:
      return state;
  }
}

/* -------------------------------- context --------------------------------- */

function useWorkspaceInternal() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const parsed = useMemo(() => parseInput(state.inputText, state.inputKind), [state.inputText, state.inputKind]);

  // Auto-detect function parameters when code changes
  useEffect(() => {
    if (!state.code.trim()) {
      dispatch({ type: "setDetectedFunction", fn: null, params: [] });
      return;
    }
    try {
      const analysis = analyzeCode(state.code, state.language);
      dispatch({
        type: "setDetectedFunction",
        fn: analysis.entryFunction,
        params: analysis.entryFunction?.params ?? [],
      });
    } catch {
      dispatch({ type: "setDetectedFunction", fn: null, params: [] });
    }
  }, [state.code, state.language]);

  // Check validity of param inputs
  const paramErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    for (const p of state.detectedParams) {
      const raw = state.paramValues[p.name] ?? "";
      const res = parseSingleParamValue(raw, p.inferredType);
      if (!res.ok) errors[p.name] = res.message;
    }
    return errors;
  }, [state.detectedParams, state.paramValues]);

  const hasParamErrors = Object.keys(paramErrors).length > 0;

  const status: ExecutionStatus = useMemo(() => {
    if (state.error) return "error";
    if (state.isExecuting) return "running";
    if (!state.code.trim()) return "empty";
    if (state.detectedParams.length > 0 && hasParamErrors) return "invalidInput";
    if (state.detectedParams.length === 0 && !state.inputText.trim()) return "missingInput";
    if (state.detectedParams.length === 0 && !parsed.ok) return "invalidInput";
    if (state.visualizationType !== "auto" && !state.selectedVariable && state.visualizationType !== "variables")
      return "noTargetSelected";
    if (!state.hasRun || !state.events.length) return "ready";
    if (state.isPlaying) return "running";
    if (state.currentStep >= state.events.length - 1) return "complete";
    return "paused";
  }, [state, parsed.ok, hasParamErrors]);

  const canRun = !state.isExecuting && state.code.trim().length > 0 && !hasParamErrors;

  const run = useCallback(async () => {
    if (state.isExecuting) return;

    dispatch({ type: "setExecuting" });

    // Build input values:
    const inputValues: Record<string, unknown> = {};

    if (state.detectedParams.length > 0) {
      // 1. Take values directly from parameter boxes
      for (const param of state.detectedParams) {
        const raw = state.paramValues[param.name] ?? "";
        const res = parseSingleParamValue(raw, param.inferredType);
        if (res.ok) {
          inputValues[param.name] = res.value;
        } else if (param.defaultValue !== undefined) {
          inputValues[param.name] = param.defaultValue;
        }
      }
    } else if (parsed.ok) {
      // 2. Fallback to parsed raw input
      if (parsed.data.kind === "variables") {
        Object.assign(inputValues, parsed.data.values);
      } else if (parsed.data.kind === "matrix") {
        inputValues["graph"] = parsed.data.values;
        inputValues["grid"] = parsed.data.values;
        inputValues["matrix"] = parsed.data.values;
      } else if (parsed.data.kind === "array") {
        inputValues["nums"] = parsed.data.values;
        inputValues["arr"] = parsed.data.values;
      }
    }

    try {
      const result = await runCode(
        state.code,
        state.language,
        inputValues,
        { maxSteps: 10_000, timeoutMs: 5_000 },
      );

      dispatch({
        type: "run",
        events: result.events,
        error: result.error,
        executionTimeMs: result.executionTimeMs,
        logs: result.logs,
      });
    } catch (err) {
      dispatch({
        type: "run",
        events: [],
        error: {
          line: 1,
          message: err instanceof Error ? err.message : "Unknown execution error",
        },
      });
    }
  }, [state.isExecuting, state.code, state.language, state.detectedParams, state.paramValues, parsed]);

  const structure = useMemo(() => {
    if (state.selectedVariable) return state.selectedVariable;
    const first = state.events[state.currentStep]?.snapshots;
    return first ? (Object.keys(first)[0] ?? null) : null;
  }, [state.selectedVariable, state.events, state.currentStep]);

  const viz = useMemo(
    () => selectVisualizationState({ events: state.events, currentStep: state.currentStep }, structure),
    [state.events, state.currentStep, structure],
  );

  const mutationSteps = useMemo(() => selectMutationSteps(state.events), [state.events]);

  useEffect(() => {
    if (!state.isPlaying || !state.events.length) return;
    const interval = 700 / state.speed;
    const id = window.setInterval(() => dispatch({ type: "stepForward" }), interval);
    return () => window.clearInterval(id);
  }, [state.isPlaying, state.speed, state.events.length]);

  const loadExampleBySlug = useCallback((slug: string) => {
    const ex = getExample(slug);
    if (ex) dispatch({ type: "loadExample", example: ex });
  }, []);

  const jumpChange = useCallback(
    (direction: 1 | -1) => {
      const candidates = direction === 1 ? mutationSteps.filter((s) => s > state.currentStep) : [...mutationSteps].reverse().filter((s) => s < state.currentStep);
      const target = candidates[0];
      if (target !== undefined) dispatch({ type: "goto", step: target });
    },
    [mutationSteps, state.currentStep],
  );

  return {
    ...state,
    parsed,
    paramErrors,
    hasParamErrors,
    status,
    canRun,
    viz,
    structure,
    mutationSteps,
    totalSteps: state.events.length,
    dispatch,
    run,
    loadExampleBySlug,
    clearEditor: useCallback(() => dispatch({ type: "clearEditor" }), []),
    jumpChange,
  };
}

export type WorkspaceStore = ReturnType<typeof useWorkspaceInternal>;

const WorkspaceContext = createContext<WorkspaceStore | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const store = useWorkspaceInternal();
  return <WorkspaceContext.Provider value={store}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceStore {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used inside <WorkspaceProvider>");
  return ctx;
}