import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";
import { Play, AlertCircle, Sparkles } from "lucide-react";
import { GlobalNav } from "@/components/layout/GlobalNav";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { VisualizationControls } from "@/components/editor/VisualizationControls";
import { InputPanel } from "@/components/input/InputPanel";
import { VisualizationCanvas } from "@/components/visualization/VisualizationCanvas";
import { VariableInspector } from "@/components/visualization/VariableInspector";
import { PlaybackControls } from "@/components/execution/PlaybackControls";
import { ExecutionTimeline } from "@/components/execution/ExecutionTimeline";
import { StepExplanation } from "@/components/execution/StepExplanation";
import { CvButton, Pill } from "@/components/ui/cv";
import { WorkspaceProvider, useWorkspace } from "@/state/executionStore";
import { examples } from "@/data/examples";

const searchSchema = z.object({ example: z.string().optional() });

export const Route = createFileRoute("/visualize")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Visualize — CodeVisualizer" },
      {
        name: "description",
        content:
          "Step through your algorithm line by line and watch arrays, DP tables, and call stacks change in real time.",
      },
      { property: "og:title", content: "Visualize — CodeVisualizer" },
      {
        property: "og:description",
        content: "Paste an algorithm, add input, and step through every state change.",
      },
    ],
  }),
  component: () => (
    <WorkspaceProvider>
      <VisualizePage />
    </WorkspaceProvider>
  ),
});

function StatusHint() {
  const { status, error } = useWorkspace();
  if (status === "error" && error) {
    return (
      <p className="flex items-start gap-2 text-[12.5px] text-[var(--viz-delete)]">
        <AlertCircle size={13} className="mt-0.5 shrink-0" />
        <span>
          Line {error.line}: {error.message}
        </span>
      </p>
    );
  }
  const copy: Partial<Record<typeof status, string>> = {
    empty: "Write code or load an example to begin.",
    missingInput: "Add input data to run this algorithm.",
    invalidInput: "Fix the input format before running.",
    noTargetSelected: "Pick which structure to visualize.",
    ready: "Ready — press Visualize.",
  };
  const text = copy[status];
  return text ? <p className="text-[12.5px] text-text-tertiary">{text}</p> : null;
}

function VisualizePage() {
  const { example } = Route.useSearch();
  const navigate = useNavigate();
  const store = useWorkspace();
  const { code, dispatch, loadExampleBySlug, run, canRun, viz, events, title } = store;

  useEffect(() => {
    if (example) loadExampleBySlug(example);
  }, [example, loadExampleBySlug]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <GlobalNav />

      <div className="flex flex-1 flex-col gap-4 px-4 pb-28 pt-4 lg:h-[calc(100vh-3.75rem)] lg:flex-row lg:overflow-hidden lg:px-5">
        {/* Left rail: code + config */}
        <aside className="flex w-full flex-col gap-4 lg:w-[41%] lg:min-w-[420px] lg:overflow-y-auto">
          <section className="animate-panel-in glass overflow-hidden rounded-[16px]">
            <header className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-2.5">
              <input
                value={title}
                onChange={(e) => dispatch({ type: "setTitle", title: e.target.value })}
                aria-label="Session title"
                className="min-w-0 flex-1 bg-transparent text-[13.5px] font-medium text-foreground outline-none"
              />
              <div className="flex shrink-0 items-center gap-2">
                <select
                  aria-label="Load example"
                  value=""
                  onChange={(e) => navigate({ to: "/visualize", search: { example: e.target.value } })}
                  className="rounded-[8px] border border-hairline bg-surface-1 px-2 py-1 font-mono text-[11.5px] text-text-secondary outline-none"
                >
                  <option value="">Load example…</option>
                  {examples.map((ex) => (
                    <option key={ex.slug} value={ex.slug}>
                      {ex.title}
                    </option>
                  ))}
                </select>
              </div>
            </header>
            <CodeEditor
              value={code}
              onChange={(next) => dispatch({ type: "setCode", code: next })}
              activeLine={events.length ? viz?.line : undefined}
              errorLine={store.error?.line}
              minHeight={320}
              className="max-h-[46vh]"
            />
          </section>

          <section className="animate-panel-in glass rounded-[16px] p-4">
            <InputPanel />
          </section>

          <section className="animate-panel-in glass rounded-[16px] p-4">
            <VisualizationControls />
          </section>

          <div className="flex items-center gap-3 pb-2">
            <CvButton onClick={run} disabled={!canRun}>
              <Play size={14} strokeWidth={2} />
              Visualize
            </CvButton>
            <StatusHint />
          </div>
        </aside>

        {/* Canvas */}
        <main className="relative flex min-h-[60vh] flex-1 flex-col overflow-hidden rounded-[18px] border border-hairline bg-surface-1/40">
          <header className="flex items-center justify-between gap-3 border-b border-hairline px-5 py-2.5">
            <div className="flex items-center gap-2">
              <Sparkles size={13} className="text-primary" />
              <span className="font-mono text-[11.5px] text-text-secondary">Canvas</span>
            </div>
            {events.length ? <Pill tone="accent">line {viz?.line}</Pill> : <Pill>idle</Pill>}
          </header>

          <div className="flex-1 overflow-auto px-5 py-8">
            <VisualizationCanvas />
          </div>

          {events.length ? (
            <div className="border-t border-hairline px-5 py-3">
              <VariableInspector layout="strip" variables={viz?.variables ?? {}} previous={events[Math.max(0, (viz?.step ?? 0) - 1)]?.variables} />
            </div>
          ) : null}
        </main>

        {/* Right rail */}
        <aside className="flex w-full flex-col gap-4 lg:w-[22%] lg:min-w-[240px] lg:overflow-y-auto">
          <section className="animate-panel-in glass rounded-[16px] p-4">
            <ExecutionTimeline />
          </section>
          <section className="animate-panel-in glass rounded-[16px] p-4">
            <StepExplanation />
          </section>
        </aside>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-5 z-40 flex justify-center px-4">
        <PlaybackControls />
      </div>
    </div>
  );
}