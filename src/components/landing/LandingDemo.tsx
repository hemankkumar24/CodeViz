import { useEffect, useMemo, useState } from "react";
import { runMockExecution } from "@/data/mockExecutions";
import { selectVisualizationState } from "@/state/selectors";
import { ArrayVisualizer } from "@/components/visualization/ArrayVisualizer";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { getExample, getExampleCode } from "@/data/examples";
import { Pill } from "@/components/ui/cv";

/** Autoplaying hero demo: the real trace, the real renderers, no interaction needed. */
export function LandingDemo() {
  const events = useMemo(() => runMockExecution("insertion-sort"), []);
  const ex = getExample("insertion-sort");
  const code = ex ? getExampleCode(ex, "python") : "";
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!events.length) return;
    const id = window.setInterval(
      () => setStep((s) => (s + 1) % events.length),
      900,
    );
    return () => window.clearInterval(id);
  }, [events.length]);

  const viz = useMemo(() => selectVisualizationState({ events, currentStep: step }, "nums"), [events, step]);
  const values = (viz?.structures["nums"] as number[] | undefined) ?? [];

  return (
    <div className="glass animate-panel-in overflow-hidden rounded-[18px]">
      <div className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-2.5">
        <span className="font-mono text-[11.5px] text-text-secondary">insertion_sort.py</span>
        <Pill tone="accent">step {step + 1}/{events.length}</Pill>
      </div>

      <div className="grid lg:grid-cols-2">
        <CodeEditor
          value={code}
          onChange={() => {}}
          language="python"
          readOnly
          activeLine={viz?.line}
          minHeight={280}
          className="border-b border-hairline lg:border-b-0 lg:border-r"
        />
        <div className="flex flex-col justify-center gap-6 px-5 py-8">
          <ArrayVisualizer
            values={values}
            label="nums"
            highlightedCells={viz?.highlightedCells}
            changedCells={viz?.changedCells}
            changeTypes={viz?.changeTypes}
            pointers={viz?.pointers ?? {}}
          />
          <p className="text-[13px] leading-relaxed text-text-secondary">
            {viz?.explanation ?? "Stepping through the trace."}
          </p>
        </div>
      </div>
    </div>
  );
}