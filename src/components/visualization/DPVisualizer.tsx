import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Cell, IndexLabel } from "./shared/Cell";
import { EmptyState, Pill } from "@/components/ui/cv";
import type { ChangeType } from "@/types/execution";

export type DPVisualizerProps = {
  /** 1D tables are rendered as a single row so the axis language stays the same. */
  values: (number | null)[][] | (number | null)[];
  label?: string;
  changedCells?: number[][] | undefined;
  changeTypes?: Record<string, ChangeType> | undefined;
  dependencyCells?: number[][] | undefined;
  currentCell?: number[] | undefined;
  recurrence?: string | undefined;
  compact?: boolean;
};

const CELL = 44;
const GAP = 6;
const ROW_LABEL = 34;

const at = (paths: number[][] | undefined, r: number, c: number) =>
  !!paths?.some((p) => (p.length === 1 ? p[0] === c && r === 0 : p[0] === r && p[1] === c));

export function DPVisualizer({
  values,
  label = "dp",
  changedCells,
  changeTypes,
  dependencyCells,
  currentCell,
  recurrence,
  compact,
}: DPVisualizerProps) {
  const grid: (number | null)[][] = useMemo(
    () => (Array.isArray(values[0]) ? (values as (number | null)[][]) : [values as (number | null)[]]),
    [values],
  );

  if (!grid.length || !(grid[0]?.length ?? 0)) {
    return (
      <EmptyState
        title="No table yet"
        description="Run Visualize to fill the DP table cell by cell."
      />
    );
  }

  const cols = grid[0]!.length;
  const oneD = grid.length === 1;
  const cur = currentCell
    ? currentCell.length === 1
      ? [0, currentCell[0] as number]
      : (currentCell as number[])
    : null;

  const center = (r: number, c: number) => ({
    x: ROW_LABEL + c * (CELL + GAP) + CELL / 2,
    y: 22 + r * (CELL + GAP) + CELL / 2,
  });

  const arrows =
    cur && dependencyCells?.length
      ? dependencyCells.map((p) => {
          const from = center(p.length === 1 ? 0 : (p[0] as number), p.length === 1 ? (p[0] as number) : (p[1] as number));
          const to = center(cur[0] as number, cur[1] as number);
          return { from, to, key: p.join(",") };
        })
      : [];

  const width = ROW_LABEL + cols * (CELL + GAP);
  const height = 22 + grid.length * (CELL + GAP);

  return (
    <div className="w-full">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="font-mono text-[12px] text-text-secondary">{label}</span>
        <Pill>{oneD ? `1D · ${cols} cells` : `${grid.length}×${cols}`}</Pill>
        <Pill tone="glass">
          <span className="h-2 w-2 rounded-full bg-[var(--viz-dep)]" /> dependency
        </Pill>
      </div>

      <div className={cn("w-full overflow-auto cv-scrollbar pb-1", (cols > 12 || grid.length > 12) && "max-h-[440px]")}>
        <div className="relative inline-block" style={{ width, minHeight: height }}>
          {/* axis labels */}
          <div className="absolute left-0 top-0 font-mono text-[11px] text-text-tertiary">
            {oneD ? "i →" : "j →"}
          </div>
          <div className="flex gap-1.5" style={{ paddingLeft: ROW_LABEL, paddingTop: 22 - 16 }}>
            {Array.from({ length: cols }).map((_, c) => (
              <div key={c} className="flex justify-center" style={{ width: CELL }}>
                <IndexLabel>{c}</IndexLabel>
              </div>
            ))}
          </div>

          {/* dependency arrows */}
          {arrows.length ? (
            <svg
              className="pointer-events-none absolute inset-0"
              width={width}
              height={height}
              aria-hidden
            >
              <defs>
                <marker id="dp-arrow" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="var(--viz-dep)" />
                </marker>
              </defs>
              {arrows.map((a) => (
                <line
                  key={a.key}
                  x1={a.from.x}
                  y1={a.from.y}
                  x2={a.to.x}
                  y2={a.to.y}
                  stroke="var(--viz-dep)"
                  strokeWidth={1.25}
                  strokeDasharray="3 3"
                  markerEnd="url(#dp-arrow)"
                  opacity={0.75}
                />
              ))}
            </svg>
          ) : null}

          <div className="relative flex flex-col gap-1.5">
            {grid.map((row, r) => (
              <div key={r} className="flex items-center gap-1.5">
                <div className="pr-2 text-right font-mono text-[11px] text-text-tertiary" style={{ width: ROW_LABEL }}>
                  {oneD ? "dp" : r}
                </div>
                {row.map((v, c) => {
                  const changed = at(changedCells, r, c);
                  const isCurrent = !!cur && cur[0] === r && cur[1] === c;
                  const tone = isCurrent
                    ? "current"
                    : changed
                      ? "changed"
                      : at(dependencyCells, r, c)
                        ? "dependency"
                        : v === null || v === undefined
                          ? "muted"
                          : "default";
                  return (
                    <div key={c} style={{ width: CELL }} className="flex justify-center">
                      <Cell
                        value={v === null || v === undefined ? "∞" : v}
                        tone={tone}
                        size={compact ? "sm" : "md"}
                        changeType={changed ? changeTypes?.[oneD ? String(c) : `${r},${c}`] : undefined}
                        label={oneD ? `dp[${c}] = ${v ?? "uninitialized"}` : `dp[${r}][${c}] = ${v ?? "uninitialized"}`}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {recurrence ? (
        <div className="mt-4 max-w-md rounded-[12px] border border-hairline bg-surface-1 p-3">
          <p className="mb-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-text-tertiary">
            Recurrence
          </p>
          <pre className="whitespace-pre-wrap font-mono text-[12.5px] leading-relaxed text-[var(--viz-dep)]">
            {recurrence}
          </pre>
        </div>
      ) : null}
    </div>
  );
}