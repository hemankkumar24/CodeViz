import { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Cell, IndexLabel } from "./shared/Cell";
import { EmptyState, Pill } from "@/components/ui/cv";
import { Layers, Eye, Grid3X3, ArrowRight } from "lucide-react";
import type { ChangeType } from "@/types/execution";

export type DPVisualizerProps = {
  /** 1D, 2D, 3D tables or key-value memoization objects */
  values: unknown;
  label?: string;
  changedCells?: number[][] | undefined;
  changeTypes?: Record<string, ChangeType> | undefined;
  dependencyCells?: number[][] | undefined;
  currentCell?: number[] | undefined;
  recurrence?: string | undefined;
  variables?: Record<string, unknown> | undefined;
  compact?: boolean;
};

const CELL = 44;
const GAP = 6;
const ROW_LABEL = 38;

function formatDPValue(v: unknown): string | number {
  if (v === null || v === undefined) return "∅";
  if (typeof v === "number") {
    if (v <= -1e6 || v === -2147483648) return "-∞";
    if (v >= 1e8 || v === 2147483647) return "∞";
    return v;
  }
  if (typeof v === "boolean") return v ? "T" : "F";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

export function DPVisualizer({
  values,
  label = "dp",
  changedCells,
  changeTypes,
  dependencyCells,
  currentCell,
  recurrence,
  variables,
  compact,
}: DPVisualizerProps) {
  // Determine dimensionality of `values`
  const analysis = useMemo(() => {
    if (!values) return { type: "empty" as const };

    if (Array.isArray(values)) {
      if (values.length === 0) return { type: "empty" as const };

      // Check if 1D array
      if (!Array.isArray(values[0])) {
        return {
          type: "1D" as const,
          data: values as (number | null)[],
          length: values.length,
        };
      }

      // Check if 2D array
      if (!Array.isArray(values[0][0])) {
        const rows = values.length;
        const cols = Math.max(...values.map((r) => (Array.isArray(r) ? r.length : 0)));
        return {
          type: "2D" as const,
          data: values as (number | null)[][],
          rows,
          cols,
        };
      }

      // 3D Tensor / Array of 2D matrices
      const layers = values.length;
      const firstLayer = Array.isArray(values[0]) ? values[0] : [];
      const rows = firstLayer.length;
      const cols = Array.isArray(firstLayer[0]) ? firstLayer[0].length : 0;

      return {
        type: "3D" as const,
        data: values as (number | null)[][][],
        layers,
        rows,
        cols,
      };
    }

    // Object / Record memo table
    if (typeof values === "object" && values !== null) {
      const entries = Object.entries(values);
      if (entries.length === 0) return { type: "empty" as const };
      return {
        type: "memo-dict" as const,
        entries,
      };
    }

    return { type: "empty" as const };
  }, [values]);

  // Selected layer for 3D tensors
  const [selectedLayer, setSelectedLayer] = useState<number>(0);
  const [showAllLayers, setShowAllLayers] = useState<boolean>(false);

  // Auto-track layer based on current execution step variables (e.g. `i` or current cell `[i, j1, j2]`)
  useEffect(() => {
    if (analysis.type !== "3D") return;

    // 1. If changed cell or current cell has layer index
    const activePath = changedCells?.[0] ?? currentCell;
    if (activePath && activePath.length >= 3 && activePath[0] !== undefined) {
      const targetLayer = activePath[0];
      if (targetLayer >= 0 && targetLayer < analysis.layers) {
        setSelectedLayer(targetLayer);
        return;
      }
    }

    // 2. If variable `i` matches layer
    if (variables && typeof variables["i"] === "number") {
      const vI = variables["i"];
      if (vI >= 0 && vI < analysis.layers) {
        setSelectedLayer(vI);
      }
    }
  }, [analysis, changedCells, currentCell, variables]);

  if (analysis.type === "empty") {
    return (
      <EmptyState
        title="No DP table yet"
        description="Run Visualize to watch the DP table fill cell by cell."
      />
    );
  }

  // Render 1D DP table
  if (analysis.type === "1D") {
    const list = analysis.data;
    const len = list.length;
    const width = ROW_LABEL + len * (CELL + GAP);
    const height = 22 + CELL + GAP;

    return (
      <div className="w-full">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[12px] font-medium text-text-secondary">{label}</span>
          <Pill>1D · {len} cells</Pill>
          <Pill tone="glass">
            <span className="h-2 w-2 rounded-full bg-[var(--viz-dep)]" /> dependency
          </Pill>
        </div>

        <div className="w-full overflow-auto cv-scrollbar pb-2">
          <div className="relative inline-block" style={{ width, minHeight: height }}>
            <div className="absolute left-0 top-0 font-mono text-[11px] text-text-tertiary">
              i →
            </div>
            <div className="flex gap-1.5" style={{ paddingLeft: ROW_LABEL, paddingTop: 6 }}>
              {Array.from({ length: len }).map((_, c) => (
                <div key={c} className="flex justify-center" style={{ width: CELL }}>
                  <IndexLabel>{c}</IndexLabel>
                </div>
              ))}
            </div>

            <div className="mt-1 flex items-center gap-1.5">
              <div className="pr-2 text-right font-mono text-[11px] text-text-tertiary" style={{ width: ROW_LABEL }}>
                dp
              </div>
              {list.map((v, c) => {
                const changed = changedCells?.some((p) => p[0] === c || (p.length === 1 && p[0] === c));
                const isCurrent = currentCell && currentCell[0] === c;
                const isDep = dependencyCells?.some((p) => p[0] === c || (p.length === 1 && p[0] === c));

                const tone = isCurrent
                  ? "current"
                  : changed
                    ? "changed"
                    : isDep
                      ? "dependency"
                      : v === null || v === undefined
                        ? "muted"
                        : "default";

                return (
                  <div key={c} style={{ width: CELL }} className="flex justify-center">
                    <Cell
                      value={formatDPValue(v)}
                      tone={tone}
                      size={compact ? "sm" : "md"}
                      changeType={changed ? changeTypes?.[String(c)] : undefined}
                      label={`${label}[${c}] = ${v ?? "uninitialized"}`}
                    />
                  </div>
                );
              })}
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

  // Render 2D DP table
  if (analysis.type === "2D") {
    const grid = analysis.data;
    const rows = analysis.rows;
    const cols = analysis.cols;
    const width = ROW_LABEL + cols * (CELL + GAP);
    const height = 22 + rows * (CELL + GAP);

    const cur = currentCell && currentCell.length >= 2 ? currentCell : null;

    const center = (r: number, c: number) => ({
      x: ROW_LABEL + c * (CELL + GAP) + CELL / 2,
      y: 22 + r * (CELL + GAP) + CELL / 2,
    });

    const arrows =
      cur && dependencyCells?.length
        ? dependencyCells
            .filter((p) => p.length >= 2)
            .map((p) => {
              const from = center(p[0]!, p[1]!);
              const to = center(cur[0]!, cur[1]!);
              return { from, to, key: p.join(",") };
            })
        : [];

    return (
      <div className="w-full">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[12px] font-medium text-text-secondary">{label}</span>
          <Pill>{rows}×{cols} (2D Matrix)</Pill>
          <Pill tone="glass">
            <span className="h-2 w-2 rounded-full bg-[var(--viz-dep)]" /> dependency
          </Pill>
        </div>

        <div className={cn("w-full overflow-auto cv-scrollbar pb-2", (cols > 12 || rows > 12) && "max-h-[440px]")}>
          <div className="relative inline-block" style={{ width, minHeight: height }}>
            <div className="absolute left-0 top-0 font-mono text-[11px] text-text-tertiary">
              j →
            </div>
            <div className="flex gap-1.5" style={{ paddingLeft: ROW_LABEL, paddingTop: 6 }}>
              {Array.from({ length: cols }).map((_, c) => (
                <div key={c} className="flex justify-center" style={{ width: CELL }}>
                  <IndexLabel>{c}</IndexLabel>
                </div>
              ))}
            </div>

            {arrows.length ? (
              <svg className="pointer-events-none absolute inset-0" width={width} height={height} aria-hidden>
                <defs>
                  <marker id="dp-arrow-2d" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
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
                    markerEnd="url(#dp-arrow-2d)"
                    opacity={0.75}
                  />
                ))}
              </svg>
            ) : null}

            <div className="relative flex flex-col gap-1.5">
              {grid.map((row, r) => (
                <div key={r} className="flex items-center gap-1.5">
                  <div className="pr-2 text-right font-mono text-[11px] text-text-tertiary" style={{ width: ROW_LABEL }}>
                    {r}
                  </div>
                  {Array.from({ length: cols }).map((_, c) => {
                    const v = Array.isArray(row) ? row[c] : undefined;
                    const changed = changedCells?.some((p) => p[0] === r && p[1] === c);
                    const isCurrent = cur && cur[0] === r && cur[1] === c;
                    const isDep = dependencyCells?.some((p) => p[0] === r && p[1] === c);

                    const tone = isCurrent
                      ? "current"
                      : changed
                        ? "changed"
                        : isDep
                          ? "dependency"
                          : v === null || v === undefined
                            ? "muted"
                            : "default";

                    return (
                      <div key={c} style={{ width: CELL }} className="flex justify-center">
                        <Cell
                          value={formatDPValue(v)}
                          tone={tone}
                          size={compact ? "sm" : "md"}
                          changeType={changed ? changeTypes?.[`${r},${c}`] : undefined}
                          label={`${label}[${r}][${c}] = ${v ?? "uninitialized"}`}
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

  // Render 3D Tensor / Multi-Layer DP Table (e.g. Cherry Pickup II: dp[i][j1][j2])
  if (analysis.type === "3D") {
    const tensor = analysis.data;
    const layers = analysis.layers;
    const rows = analysis.rows;
    const cols = analysis.cols;

    const renderLayerMatrix = (layerIdx: number, isGridMode = false) => {
      const matrix = Array.isArray(tensor[layerIdx]) ? tensor[layerIdx]! : [];
      const width = ROW_LABEL + cols * (CELL + GAP);
      const height = 22 + rows * (CELL + GAP);

      return (
        <div key={layerIdx} className="rounded-xl border border-hairline bg-surface-1/50 p-3.5 backdrop-blur-sm">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="font-mono text-[12px] font-semibold text-primary">
              Layer i = {layerIdx} <span className="text-text-tertiary font-normal">({rows}×{cols})</span>
            </span>
            <span className="font-mono text-[10.5px] text-text-tertiary">
              {label}[{layerIdx}][j1][j2]
            </span>
          </div>

          <div className="w-full overflow-auto cv-scrollbar pb-1">
            <div className="relative inline-block" style={{ width, minHeight: height }}>
              <div className="absolute left-0 top-0 font-mono text-[10.5px] text-text-tertiary">
                j2 →
              </div>
              <div className="flex gap-1.5" style={{ paddingLeft: ROW_LABEL, paddingTop: 6 }}>
                {Array.from({ length: cols }).map((_, c) => (
                  <div key={c} className="flex justify-center" style={{ width: CELL }}>
                    <IndexLabel>{c}</IndexLabel>
                  </div>
                ))}
              </div>

              <div className="relative flex flex-col gap-1.5">
                {Array.from({ length: rows }).map((_, r) => {
                  const row = Array.isArray(matrix[r]) ? matrix[r]! : [];
                  return (
                    <div key={r} className="flex items-center gap-1.5">
                      <div className="pr-2 text-right font-mono text-[11px] text-text-tertiary" style={{ width: ROW_LABEL }}>
                        {r}
                      </div>
                      {Array.from({ length: cols }).map((_, c) => {
                        const v = Array.isArray(row) ? row[c] : undefined;
                        const changed = changedCells?.some(
                          (p) => p[0] === layerIdx && p[1] === r && p[2] === c
                        );
                        const isCurrent =
                          currentCell &&
                          currentCell.length >= 3 &&
                          currentCell[0] === layerIdx &&
                          currentCell[1] === r &&
                          currentCell[2] === c;
                        const isDep = dependencyCells?.some(
                          (p) => p[0] === layerIdx && p[1] === r && p[2] === c
                        );

                        const tone = isCurrent
                          ? "current"
                          : changed
                            ? "changed"
                            : isDep
                              ? "dependency"
                              : v === null || v === undefined
                                ? "muted"
                                : "default";

                        return (
                          <div key={c} style={{ width: CELL }} className="flex justify-center">
                            <Cell
                              value={formatDPValue(v)}
                              tone={tone}
                              size="sm"
                              changeType={changed ? changeTypes?.[`${layerIdx},${r},${c}`] : undefined}
                              label={`${label}[${layerIdx}][${r}][${c}] = ${v ?? "uninitialized"}`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="w-full">
        {/* Header and Controls */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[13px] font-semibold text-foreground flex items-center gap-1.5">
              <Layers size={14} className="text-primary" />
              <span>{label}</span>
            </span>
            <Pill tone="accent">3D Tensor · {layers}×{rows}×{cols}</Pill>
            <Pill tone="glass">
              <span className="h-2 w-2 rounded-full bg-[var(--viz-dep)]" /> dependency
            </Pill>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-hairline bg-surface-1 p-0.5">
            <button
              type="button"
              onClick={() => setShowAllLayers(false)}
              className={cn(
                "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-mono transition-colors",
                !showAllLayers ? "bg-primary text-primary-foreground font-semibold" : "text-text-secondary hover:text-foreground"
              )}
            >
              <Eye size={12} />
              <span>Single Slice</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAllLayers(true)}
              className={cn(
                "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-mono transition-colors",
                showAllLayers ? "bg-primary text-primary-foreground font-semibold" : "text-text-secondary hover:text-foreground"
              )}
            >
              <Grid3X3 size={12} />
              <span>All Layers ({layers})</span>
            </button>
          </div>
        </div>

        {/* Slices Navigation Tabs (when in single slice mode) */}
        {!showAllLayers ? (
          <div className="mb-4 flex flex-wrap items-center gap-1.5 rounded-xl border border-hairline bg-surface-1/70 p-2">
            <span className="mr-1.5 font-mono text-[11px] text-text-tertiary uppercase tracking-wider">
              Layer i:
            </span>
            {Array.from({ length: layers }).map((_, idx) => {
              const isActive = selectedLayer === idx;
              const hasActivity = changedCells?.some((p) => p[0] === idx);

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedLayer(idx)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-xs transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground font-semibold shadow-[0_0_12px_rgba(76,140,255,0.35)]"
                      : "border border-hairline bg-surface-2 text-text-secondary hover:bg-surface-3 hover:text-foreground"
                  )}
                >
                  <span>Layer {idx}</span>
                  {hasActivity ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" title="Active on this step" />
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}

        {/* Layer View Grid */}
        {showAllLayers ? (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
            {Array.from({ length: layers }).map((_, idx) => renderLayerMatrix(idx, true))}
          </div>
        ) : (
          renderLayerMatrix(selectedLayer, false)
        )}

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

  // Render Dictionary / Map Memoization Table
  if (analysis.type === "memo-dict") {
    return (
      <div className="w-full">
        <div className="mb-3 flex items-center gap-2">
          <span className="font-mono text-[12px] font-medium text-text-secondary">{label}</span>
          <Pill>Memo Table · {analysis.entries.length} cached states</Pill>
        </div>

        <div className="max-h-[380px] overflow-auto rounded-xl border border-hairline bg-surface-1 p-3 cv-scrollbar">
          <div className="grid gap-2">
            {analysis.entries.map(([key, val]) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg border border-hairline bg-surface-2 px-3 py-2 font-mono text-xs"
              >
                <div className="flex items-center gap-2 text-text-secondary">
                  <span className="text-primary font-semibold">{label}</span>
                  <span>[{key}]</span>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowRight size={12} className="text-text-tertiary" />
                  <span className="font-bold text-foreground bg-primary/15 px-2 py-0.5 rounded border border-primary/30">
                    {formatDPValue(val)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}