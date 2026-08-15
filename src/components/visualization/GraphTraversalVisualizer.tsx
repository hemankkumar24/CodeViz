import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Pill } from "@/components/ui/cv";
import { ArrowRight, CheckCircle2, CircleDot, Layers, ListOrdered } from "lucide-react";

export type GraphTraversalVisualizerProps = {
  graph?: (number | null)[][] | null | undefined;
  queue?: (number | null)[] | null | undefined;
  order?: (number | null)[] | null | undefined;
  seen?: (number | null)[] | null | undefined;
  variables: Record<string, unknown>;
  explanation?: string | null | undefined;
};

export function GraphTraversalVisualizer({
  graph,
  queue,
  order,
  seen,
  variables,
  explanation,
}: GraphTraversalVisualizerProps) {
  const nodeVal = variables["node"];
  const uVal = variables["u"];
  const currentNode = typeof nodeVal === "number" ? nodeVal : typeof uVal === "number" ? uVal : null;

  const nxtVal = variables["nxt"];
  const vVal = variables["v"];
  const neighborVal = variables["neighbor"];
  const currentNeighbor =
    typeof nxtVal === "number"
      ? nxtVal
      : typeof vVal === "number"
        ? vVal
        : typeof neighborVal === "number"
          ? neighborVal
          : null;

  const queueSet = useMemo(() => new Set(queue?.filter((x): x is number => typeof x === "number") ?? []), [queue]);
  const seenSet = useMemo(() => new Set(seen?.filter((x): x is number => typeof x === "number") ?? []), [seen]);

  const numNodes = graph?.length ?? 0;
  const nodes = useMemo(() => Array.from({ length: numNodes }, (_, i) => i), [numNodes]);

  return (
    <div className="flex w-full flex-col gap-6">
      {/* 1. GRAPH TOPOLOGY & NODE STATUS */}
      {graph && graph.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[12.5px] font-semibold text-foreground">Graph Adjacency & Node States</span>
              <Pill>{numNodes} Nodes</Pill>
            </div>
            {currentNode !== null && (
              <span className="flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 font-mono text-[11.5px] font-medium text-primary">
                <CircleDot size={12} className="animate-pulse" />
                Active Node: {currentNode}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5">
            {nodes.map((nodeId) => {
              const isCurrent = currentNode === nodeId;
              const isNeighbor = currentNeighbor === nodeId;
              const isInQueue = queueSet.has(nodeId);
              const isVisited = seenSet.has(nodeId);
              const neighbors = (graph[nodeId] ?? []).filter((x): x is number => typeof x === "number");

              return (
                <div
                  key={nodeId}
                  className={cn(
                    "flex flex-col gap-2 rounded-[12px] border p-3 transition-all duration-200",
                    isCurrent
                      ? "border-primary bg-primary/15 shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)] ring-2 ring-primary/30"
                      : isNeighbor
                        ? "border-[var(--viz-insert)] bg-[var(--viz-insert)]/10"
                        : isInQueue
                          ? "border-[var(--viz-focus)] bg-[var(--viz-focus)]/10"
                          : isVisited
                            ? "border-hairline bg-surface-2/70 opacity-80"
                            : "border-hairline bg-surface-1/60 opacity-60"
                  )}
                >
                  {/* Node Header */}
                  <div className="flex items-center justify-between">
                    <div
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full font-mono text-[13px] font-bold transition-transform",
                        isCurrent
                          ? "bg-primary text-primary-foreground scale-110 shadow-md"
                          : isNeighbor
                            ? "bg-[var(--viz-insert)] text-black"
                            : isInQueue
                              ? "bg-[var(--viz-focus)] text-white"
                              : isVisited
                                ? "bg-surface-3 text-text-secondary"
                                : "bg-surface-2 text-text-tertiary"
                      )}
                    >
                      {nodeId}
                    </div>

                    <span className="font-mono text-[10px] uppercase tracking-wider">
                      {isCurrent ? (
                        <span className="font-bold text-primary">Active</span>
                      ) : isNeighbor ? (
                        <span className="font-bold text-[var(--viz-insert)]">Target</span>
                      ) : isInQueue ? (
                        <span className="text-[var(--viz-focus)]">In Queue</span>
                      ) : isVisited ? (
                        <span className="text-text-tertiary">Visited</span>
                      ) : (
                        <span className="text-text-tertiary/60">Unvisited</span>
                      )}
                    </span>
                  </div>

                  {/* Neighbors list */}
                  <div className="flex items-center gap-1 overflow-x-auto pt-1 font-mono text-[11px] text-text-tertiary">
                    <span className="shrink-0 text-[10px] text-text-tertiary/70">Adj:</span>
                    {neighbors.length > 0 ? (
                      neighbors.map((nb) => (
                        <span
                          key={nb}
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[11px]",
                            currentNeighbor === nb && isCurrent
                              ? "bg-[var(--viz-insert)] font-bold text-black"
                              : "bg-surface-2 text-text-secondary"
                          )}
                        >
                          {nb}
                        </span>
                      ))
                    ) : (
                      <span className="italic text-text-tertiary/50">none</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. FIFO QUEUE VISUALIZATION */}
      {queue !== undefined && (
        <div className="flex flex-col gap-2 rounded-[14px] border border-hairline bg-surface-1/70 p-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono text-[12px] font-medium text-text-secondary">
              <Layers size={14} className="text-primary" />
              <span>FIFO Queue (`queue`)</span>
            </div>
            <span className="font-mono text-[11px] text-text-tertiary">
              {queue?.length ?? 0} item{(queue?.length ?? 0) === 1 ? "" : "s"}
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto py-1">
            <span className="shrink-0 rounded-[6px] border border-primary/30 bg-primary/10 px-2 py-1 font-mono text-[10.5px] font-medium text-primary">
              FRONT ➡️
            </span>

            {queue && queue.length > 0 ? (
              <div className="flex items-center gap-1.5">
                {queue.map((val, idx) => (
                  <div
                    key={`q-${idx}-${val}`}
                    className={cn(
                      "flex h-9 min-w-9 items-center justify-center rounded-[8px] border px-2.5 font-mono text-[13px] font-semibold transition-all",
                      idx === 0
                        ? "border-primary bg-primary/20 text-foreground ring-1 ring-primary/40"
                        : "border-hairline bg-surface-2 text-foreground"
                    )}
                  >
                    {val}
                  </div>
                ))}
              </div>
            ) : (
              <span className="font-mono text-[12px] italic text-text-tertiary">
                [ Queue is currently empty ]
              </span>
            )}

            {queue && queue.length > 0 && (
              <span className="shrink-0 rounded-[6px] border border-hairline bg-surface-2 px-2 py-1 font-mono text-[10.5px] text-text-tertiary">
                ⬅️ BACK
              </span>
            )}
          </div>
        </div>
      )}

      {/* 3. VISITED SET & TRAVERSAL ORDER */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Visited Set */}
        <div className="flex flex-col gap-2 rounded-[14px] border border-hairline bg-surface-1/70 p-3.5">
          <div className="flex items-center gap-2 font-mono text-[12px] font-medium text-text-secondary">
            <CheckCircle2 size={14} className="text-[var(--viz-insert)]" />
            <span>Visited Set (`seen`)</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 py-1">
            {seen && seen.length > 0 ? (
              seen.map((val) => (
                <span
                  key={`seen-${val}`}
                  className="flex items-center gap-1 rounded-[7px] border border-[var(--viz-insert)]/30 bg-[var(--viz-insert)]/10 px-2 py-1 font-mono text-[12px] font-medium text-foreground"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--viz-insert)]" />
                  {val}
                </span>
              ))
            ) : (
              <span className="font-mono text-[12px] italic text-text-tertiary">
                [ No nodes visited yet ]
              </span>
            )}
          </div>
        </div>

        {/* Traversal Order */}
        <div className="flex flex-col gap-2 rounded-[14px] border border-hairline bg-surface-1/70 p-3.5">
          <div className="flex items-center gap-2 font-mono text-[12px] font-medium text-text-secondary">
            <ListOrdered size={14} className="text-[var(--viz-focus)]" />
            <span>Traversal Order (`order`)</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {order && order.length > 0 ? (
              order.map((val, idx) => (
                <div key={`order-${idx}`} className="flex items-center gap-1">
                  <span className="flex h-7 min-w-7 items-center justify-center rounded-[6px] border border-hairline bg-surface-2 px-2 font-mono text-[12px] font-semibold text-foreground">
                    {val}
                  </span>
                  {idx < order.length - 1 && <ArrowRight size={10} className="text-text-tertiary" />}
                </div>
              ))
            ) : (
              <span className="font-mono text-[12px] italic text-text-tertiary">
                [ Traversal starting... ]
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
