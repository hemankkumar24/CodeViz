import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Cell, IndexLabel, PointerLabel } from "./shared/Cell";
import { EmptyState, GhostCells, Pill } from "@/components/ui/cv";
import type { ChangeType } from "@/types/execution";

export type ArrayVisualizerProps = {
  values: (number | null)[];
  label?: string;
  highlightedCells?: number[][] | undefined;
  changedCells?: number[][] | undefined;
  changeTypes?: Record<string, ChangeType> | undefined;
  dependencyCells?: number[][] | undefined;
  pointers?: Record<string, number[]> | undefined;
  compact?: boolean;
  size?: "sm" | "md" | "lg";
};

const has = (paths: number[][] | undefined, i: number) => !!paths?.some((p) => p[0] === i);

/** Pure renderer. Receives a snapshot + highlighted paths, nothing else. */
export function ArrayVisualizer({
  values,
  label,
  highlightedCells,
  changedCells,
  changeTypes,
  dependencyCells,
  pointers = {},
  compact,
  size,
}: ArrayVisualizerProps) {
  const large = values.length > 30;
  const cellSize = size ?? (compact || large ? "sm" : values.length > 16 ? "sm" : "md");

  const pointerRows = useMemo(() => {
    const byIndex = new Map<number, string[]>();
    for (const [name, path] of Object.entries(pointers)) {
      const idx = path[0];
      if (idx === undefined) continue;
      byIndex.set(idx, [...(byIndex.get(idx) ?? []), name]);
    }
    const depth = Math.max(1, ...[...byIndex.values()].map((n) => n.length));
    return { byIndex, depth };
  }, [pointers]);

  if (!values.length) {
    return (
      <div className="w-full">
        {label ? (
          <div className="mb-2 flex items-center gap-2">
            <span className="font-mono text-[12px] text-text-secondary">{label}</span>
            <Pill>0 elements</Pill>
          </div>
        ) : null}
        <div className="flex h-12 w-full items-center justify-center rounded-[10px] border border-dashed border-hairline/80 bg-surface-1/40 font-mono text-[12px] text-text-tertiary">
          [ empty array ]
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {label ? (
        <div className="mb-2 flex items-center gap-2">
          <span className="font-mono text-[12px] text-text-secondary">{label}</span>
          <Pill>{values.length} elements</Pill>
        </div>
      ) : null}

      <div className="relative w-full overflow-x-auto cv-scrollbar py-1">
        <div className="inline-flex min-w-full flex-col items-start gap-1.5 px-1 py-1">
          {/* pointer lane above the row */}
          <div className="flex items-end gap-1.5">
            {values.map((_, i) => (
              <div
                key={`ptr-${i}`}
                className={cn(
                  "flex flex-col items-center justify-end gap-0.5",
                  cellSize === "sm" ? "min-w-8" : cellSize === "lg" ? "min-w-14" : "min-w-11",
                )}
                style={{ minHeight: pointerRows.depth * 22 }}
              >
                {(pointerRows.byIndex.get(i) ?? []).map((name) => (
                  <PointerLabel key={name} name={name} active />
                ))}
              </div>
            ))}
          </div>

          {/* comparison bracket */}
          {highlightedCells && highlightedCells.length > 1 ? (
            <div className="-mt-1 mb-0.5 flex items-center gap-1.5">
              {values.map((_, i) => (
                <div
                  key={`cmp-${i}`}
                  className={cn(
                    "h-[2px] rounded-full",
                    cellSize === "sm" ? "min-w-8" : cellSize === "lg" ? "min-w-14" : "min-w-11",
                    has(highlightedCells, i) ? "bg-primary/60" : "bg-transparent",
                  )}
                />
              ))}
            </div>
          ) : null}

          <div className="flex items-center gap-1.5">
            {values.map((v, i) => {
              const changed = has(changedCells, i);
              const tone = changed
                ? "changed"
                : has(dependencyCells, i)
                  ? "dependency"
                  : has(highlightedCells, i)
                    ? (highlightedCells?.length ?? 0) > 1
                      ? "compared"
                      : "current"
                    : "default";
              return (
                <Cell
                  key={i}
                  value={v}
                  tone={tone}
                  size={cellSize}
                  changeType={changed ? changeTypes?.[String(i)] : undefined}
                  label={`index ${i}, value ${v ?? "empty"}`}
                />
              );
            })}
          </div>

          <div className="flex items-center gap-1.5">
            {values.map((_, i) => (
              <div
                key={`idx-${i}`}
                className={cn(
                  "flex justify-center",
                  cellSize === "sm" ? "min-w-8" : cellSize === "lg" ? "min-w-14" : "min-w-11",
                )}
              >
                <IndexLabel>{i}</IndexLabel>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}