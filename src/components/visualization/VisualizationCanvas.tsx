import { ArrayVisualizer } from "./ArrayVisualizer";
import { MatrixVisualizer } from "./MatrixVisualizer";
import { DPVisualizer } from "./DPVisualizer";
import { RecursionVisualizer } from "./RecursionVisualizer";
import { VariableInspector } from "./VariableInspector";
import { GraphTraversalVisualizer } from "./GraphTraversalVisualizer";
import { EmptyState, GhostCells } from "@/components/ui/cv";
import { useWorkspace } from "@/state/executionStore";
import type { VisualizationType } from "@/types/execution";

const asArray = (v: unknown): (number | null)[] | null =>
  Array.isArray(v) && !Array.isArray(v[0]) ? (v as (number | null)[]) : null;
const asMatrix = (v: unknown): (number | null)[][] | null =>
  Array.isArray(v) && Array.isArray(v[0]) ? (v as (number | null)[][]) : null;

/**
 * Dispatches to a renderer based on the selected visualization type.
 * Every renderer receives the derived snapshot only — no execution logic here.
 */
export function VisualizationCanvas() {
  const { viz, visualizationType, structure, status, events, multiSelection } = useWorkspace();

  if (!events.length || !viz) {
    return (
      <EmptyState
        title={status === "error" ? "Execution stopped" : "Nothing to visualize yet"}
        description={
          status === "error"
            ? "Fix the highlighted line, then run Visualize again."
            : "Write or load an algorithm, add input, then press Visualize to step through it."
        }
        visual={<GhostCells count={5} />}
      />
    );
  }

  const hasGraphOrQueue =
    ("graph" in viz.structures && ("queue" in viz.structures || "seen" in viz.structures || "order" in viz.structures)) ||
    ("queue" in viz.structures && "seen" in viz.structures);

  const isRecursionTrace =
    (viz.callstack?.length ?? 0) > 1 ||
    events.some((e) => (e.callstack?.length ?? 0) > 1);

  const snapshot = structure ? viz.structures[structure] : undefined;

  const is3DArray = (v: unknown): boolean =>
    Array.isArray(v) && Array.isArray(v[0]) && Array.isArray(v[0][0]);

  const isDPName = (name: string | null): boolean =>
    !!name && /^(dp|memo|cache|table|opt|cost|ans)/i.test(name);

  const resolved: VisualizationType =
    visualizationType !== "auto"
      ? visualizationType
      : hasGraphOrQueue
        ? "multiple"
        : isDPName(structure) || is3DArray(snapshot)
          ? "dp"
          : isRecursionTrace
            ? "recursion"
            : asMatrix(snapshot)
              ? "matrix"
              : asArray(snapshot)
                ? "array"
                : "variables";

  const prevVariables = events[Math.max(0, viz.step - 1)]?.variables;

  // Render specialized Graph/BFS/DFS visualizer when graph & queue structures exist
  if (visualizationType === "auto" && hasGraphOrQueue) {
    return (
      <div className="flex flex-col gap-6">
        <GraphTraversalVisualizer
          graph={asMatrix(viz.structures["graph"])}
          queue={asArray(viz.structures["queue"])}
          order={asArray(viz.structures["order"])}
          seen={asArray(viz.structures["seen"])}
          variables={viz.variables}
          explanation={viz.explanation}
        />
        {viz.explanation && (
          <p className="max-w-xl font-mono text-[13px] leading-relaxed text-text-secondary">
            {viz.explanation}
          </p>
        )}
      </div>
    );
  }

  const renderOne = (type: VisualizationType, name: string | null) => {
    const data = name ? viz.structures[name] : snapshot;
    switch (type) {
      case "recursion":
        return (
          <RecursionVisualizer
            frames={viz.callstack ?? []}
            activeId={viz.callstack?.find((f) => f.status === "active")?.id}
            memoHits={viz.callstack?.filter((f) => f.label.includes("memo")).map((f) => f.id)}
          />
        );
      case "matrix": {
        const m = asMatrix(data);
        return m ? (
          <MatrixVisualizer
            values={m}
            label={name ?? structure ?? "matrix"}
            highlightedCells={viz.highlightedCells}
            changedCells={viz.changedCells}
            changeTypes={viz.changeTypes}
          />
        ) : is3DArray(data) ? (
          <DPVisualizer
            values={data}
            label={name ?? structure ?? "matrix"}
            changedCells={viz.changedCells}
            changeTypes={viz.changeTypes}
            dependencyCells={viz.dependencyCells}
            currentCell={viz.highlightedCells[0]}
            variables={viz.variables}
          />
        ) : (
          <EmptyState title="Not a matrix" description={`"${name ?? structure}" isn't a 2D structure on this step.`} />
        );
      }
      case "dp": {
        return data !== undefined && data !== null ? (
          <DPVisualizer
            values={data}
            label={name ?? structure ?? "dp"}
            changedCells={viz.changedCells}
            changeTypes={viz.changeTypes}
            dependencyCells={viz.dependencyCells}
            currentCell={viz.highlightedCells[0]}
            recurrence={viz.recurrence}
            variables={viz.variables}
          />
        ) : (
          <EmptyState title="No table" description="This step has no DP table snapshot." />
        );
      }
      case "variables":
        return <VariableInspector variables={viz.variables} previous={prevVariables} />;
      case "array":
      default: {
        const a = asArray(data);
        return a ? (
          <ArrayVisualizer
            values={a}
            label={name ?? structure ?? "array"}
            highlightedCells={viz.highlightedCells}
            changedCells={viz.changedCells}
            changeTypes={viz.changeTypes}
            dependencyCells={viz.dependencyCells}
            pointers={viz.pointers}
          />
        ) : (
          <EmptyState title="Not an array" description={`"${name ?? structure}" isn't a 1D array on this step.`} />
        );
      }
    }
  };

  if (resolved === "multiple") {
    const names = multiSelection.length ? multiSelection : Object.keys(viz.structures).slice(0, 3);
    return (
      <div className="flex flex-col gap-8">
        {names.map((name) => {
          const data = viz.structures[name];
          return (
            <div key={name}>{renderOne(asMatrix(data) ? "matrix" : "array", name)}</div>
          );
        })}
        <VariableInspector variables={viz.variables} previous={prevVariables} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {renderOne(resolved, structure)}
      {viz.explanation ? (
        <p className="max-w-xl font-mono text-[13px] leading-relaxed text-text-secondary">{viz.explanation}</p>
      ) : null}
    </div>
  );
}