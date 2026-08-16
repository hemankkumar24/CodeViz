import { cn } from "@/lib/utils";
import { Cell, IndexLabel } from "./shared/Cell";
import { EmptyState, Pill } from "@/components/ui/cv";
import type { ChangeType } from "@/types/execution";

export type MatrixVisualizerProps = {
  values: (number | null)[][];
  label?: string;
  highlightedCells?: number[][] | undefined;
  changedCells?: number[][] | undefined;
  changeTypes?: Record<string, ChangeType> | undefined;
  compact?: boolean;
};

const at = (paths: number[][] | undefined, r: number, c: number) =>
  !!paths?.some((p) => p[0] === r && p[1] === c);

/**
 * Deliberately neutral compared to the DP table: no dependency arrows,
 * no recurrence, quieter current-cell treatment.
 */
export function MatrixVisualizer({
  values,
  label,
  highlightedCells,
  changedCells,
  changeTypes,
  compact,
}: MatrixVisualizerProps) {
  if (!values.length) {
    return (
      <EmptyState
        title="No matrix data yet"
        description="Provide a matrix input and run Visualize to watch it change."
      />
    );
  }

  const cols = values[0]?.length ?? 0;
  const large = values.length > 12 || cols > 12;
  const size = compact || large ? "sm" : "md";

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center gap-2">
        <span className="font-mono text-[12px] text-text-secondary">{label ?? "matrix"}</span>
        <Pill>
          {values.length}×{cols}
        </Pill>
      </div>

      <div className={cn("w-full", large && "max-h-[420px] overflow-auto")}>
        <div className="inline-block">
          <div className="flex gap-1.5 pl-8">
            {Array.from({ length: cols }).map((_, c) => (
              <div key={c} className={cn("flex justify-center", size === "sm" ? "min-w-8" : "min-w-11")}>
                <IndexLabel>{c}</IndexLabel>
              </div>
            ))}
          </div>
          <div className="mt-1 flex flex-col gap-1.5">
            {values.map((row, r) => (
              <div key={r} className="flex items-center gap-1.5">
                <div className="w-8 pr-2 text-right">
                  <IndexLabel>{r}</IndexLabel>
                </div>
                {row.map((v, c) => {
                  const changed = at(changedCells, r, c);
                  return (
                    <Cell
                      key={c}
                      value={v}
                      size={size}
                      tone={changed ? "changed" : at(highlightedCells, r, c) ? "current" : "default"}
                      changeType={changed ? changeTypes?.[`${r},${c}`] : undefined}
                      label={`row ${r}, column ${c}, value ${v ?? "empty"}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}