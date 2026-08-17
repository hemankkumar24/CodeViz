import { useWorkspace } from "@/state/executionStore";
import { SegmentedControl } from "@/components/ui/cv";
import { cn } from "@/lib/utils";
import type { VisualizationType } from "@/types/execution";

const TYPES: { value: VisualizationType; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "linkedlist", label: "List" },
  { value: "array", label: "Array" },
  { value: "matrix", label: "Matrix" },
  { value: "dp", label: "DP" },
  { value: "recursion", label: "Calls" },
  { value: "variables", label: "Vars" },
  { value: "multiple", label: "Multi" },
];

export function VisualizationControls() {
  const { visualizationType, dispatch, viz, selectedVariable, dpDimensions, multiSelection } =
    useWorkspace();
  const names = viz ? Object.keys(viz.structures) : [];

  return (
    <div className="flex flex-col gap-3">
      <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-text-tertiary">
        Visualization
      </p>

      <SegmentedControl
        value={visualizationType}
        options={TYPES}
        size="sm"
        className="flex-wrap"
        onChange={(value) => dispatch({ type: "setVisualizationType", value })}
      />

      {visualizationType === "dp" ? (
        <SegmentedControl
          value={dpDimensions}
          size="sm"
          options={[
            { value: "1D" as const, label: "1D table" },
            { value: "2D" as const, label: "2D table" },
          ]}
          onChange={(value) => dispatch({ type: "setDpDimensions", value })}
        />
      ) : null}

      {names.length && visualizationType !== "variables" ? (
        <div className="flex flex-wrap gap-1.5">
          {names.map((name) => {
            const active =
              visualizationType === "multiple"
                ? multiSelection.includes(name)
                : selectedVariable === name;
            return (
              <button
                key={name}
                type="button"
                onClick={() =>
                  visualizationType === "multiple"
                    ? dispatch({ type: "toggleMulti", value: name })
                    : dispatch({ type: "setSelectedVariable", value: active ? null : name })
                }
                className={cn(
                  "rounded-full border px-2.5 py-1 font-mono text-[11.5px] transition-colors",
                  active
                    ? "border-primary/50 bg-primary/12 text-primary"
                    : "border-hairline bg-surface-1 text-text-secondary hover:text-foreground",
                )}
              >
                {name}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="font-mono text-[11.5px] text-text-tertiary">
          Run a trace to pick which structure to watch.
        </p>
      )}
    </div>
  );
}