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
import { getExample, type Example } from "@/data/examples";
import { runMockExecution } from "@/data/mockExecutions";
import { selectMutationSteps, selectVisualizationState } from "./selectors";

/* ------------------------------ input parsing ----------------------------- */

export type ParsedInput =
  | { ok: true; data: InputData; summary: string }
  | { ok: false; message: string };

export function parseInput(raw: string, kind: InputData["kind"]): ParsedInput {
  const text = raw.trim();
  if (!text) return { ok: false, message: "Input is empty." };

  if (kind === "variables") {
    const entries: Record<string, number> = {};
    for (const part of text.split(/[\n,]+/)) {
      const piece = part.trim();
      if (!piece) continue;
      const match = /^([A-Za-z_]\w*)\s*[=:]\s*(-?\d+(?:\.\d+)?)$/.exec(piece);
      if (!match) return { ok: false, message: `Expected \`name = number\`, found \`${piece}\`.` };
      entries[match[1] as string] = Number(match[2]);
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
    if (values.some((r) => r.length !== width))
      return { ok: false, message: "All rows must have the same number of columns." };
    return { ok: true, data: { kind: "matrix", values }, summary: `${values.length}×${width} matrix detected` };
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

type State = {
  title: string;
  exampleSlug: string | null;
  code: string;
  inputKind: InputData["kind"];
  inputText: string;
  visualizationType: VisualizationType;
  selectedVariable: string | null;
  dpDimensions: "1D" | "2D";
  multiSelection: string[];
  events: ExecutionEvent[];
  currentStep: number;
  isPlaying: boolean;
  speed: PlaybackSpeed;
  hasRun: boolean;
  error: { line: number; message: string } | null;
};

const initialState: State = {
  title: "Untitled",
  exampleSlug: null,
  code: "",
  inputKind: "array",
  inputText: "",
  visualizationType: "auto",
  selectedVariable: null,
  dpDimensions: "1D",
  multiSelection: [],
  events: [],
  currentStep: 0,
  isPlaying: false,
  speed: 1,
  hasRun: false,
  error: null,
};

type Action =
  | { type: "setTitle"; title: string }
  | { type: "setCode"; code: string }
  | { type: "setInputKind"; kind: InputData["kind"] }
  | { type: "setInputText"; text: string }
  | { type: "setVisualizationType"; value: VisualizationType }
  | { type: "setSelectedVariable"; value: string | null }
  | { type: "setDpDimensions"; value: "1D" | "2D" }
  | { type: "toggleMulti"; value: string }
  | { type: "loadExample"; example: Example }
  | { type: "run"; events: ExecutionEvent[]; error: State["error"] }
  | { type: "play" }
  | { type: "pause" }
  | { type: "goto"; step: number }
  | { type: "stepForward" }
  | { type: "stepBack" }
  | { type: "restart" }
  | { type: "setSpeed"; speed: PlaybackSpeed }
  | { type: "reset" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "setTitle":
      return { ...state, title: action.title };
    case "setCode":
      return { ...state, code: action.code, events: [], hasRun: false, isPlaying: false, currentStep: 0, error: null };
    case "setInputKind":
      return { ...state, inputKind: action.kind, events: [], hasRun: false, isPlaying: false };
    case "setInputText":
      return { ...state, inputText: action.text, events: [], hasRun: false, isPlaying: false, currentStep: 0 };
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
      const inputText =
        ex.input.kind === "array"
          ? `[${ex.input.values.join(", ")}]`
          : ex.input.kind === "matrix"
            ? ex.input.values.map((r) => `[${r.join(", ")}]`).join("\n")
            : Object.entries(ex.input.values)
                .map(([k, v]) => `${k} = ${v}`)
                .join("\n");
      return {
        ...initialState,
        title: ex.title,
        exampleSlug: ex.slug,
        code: ex.code,
        inputKind: ex.input.kind,
        inputText,
        visualizationType: ex.visualizationType,
        selectedVariable: ex.targetVariable,
        dpDimensions: ex.slug === "knapsack" ? "2D" : "1D",
      };
    }
    case "run":
      return {
        ...state,
        events: action.events,
        error: action.error,
        currentStep: 0,
        hasRun: true,
        isPlaying: action.error ? false : true,
      };
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

  const status: ExecutionStatus = useMemo(() => {
    if (state.error) return "error";
    if (!state.code.trim()) return "empty";
    if (!state.inputText.trim()) return "missingInput";
    if (!parsed.ok) return "invalidInput";
    if (state.visualizationType !== "auto" && !state.selectedVariable && state.visualizationType !== "variables")
      return "noTargetSelected";
    if (!state.hasRun || !state.events.length) return "ready";
    if (state.isPlaying) return "running";
    if (state.currentStep >= state.events.length - 1) return "complete";
    return "paused";
  }, [state, parsed.ok]);

  const canRun = status === "ready" || state.hasRun;

  const run = useCallback(() => {
    const slug = state.exampleSlug;
    const values = parsed.ok && parsed.data.kind === "array" ? parsed.data.values : undefined;
    const events = slug ? runMockExecution(slug, values) : [];
    if (!events.length) {
      dispatch({
        type: "run",
        events: [],
        error: {
          line: Math.max(1, state.code.split("\n").length - 1),
          message: slug
            ? "No authored trace for this algorithm yet — graph traversals are on the roadmap."
            : "Execution failed: this frontend runs authored traces only. Load an example to step through a trace.",
        },
      });
      return;
    }
    dispatch({ type: "run", events, error: null });
  }, [state.exampleSlug, state.code, parsed]);

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

  // Playback ticker — advances the step at the selected speed.
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
    status,
    canRun,
    viz,
    structure,
    mutationSteps,
    totalSteps: state.events.length,
    dispatch,
    run,
    loadExampleBySlug,
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