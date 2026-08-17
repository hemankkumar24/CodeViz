import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Sparkles, AlertTriangle, ArrowRight, CornerDownRight } from "lucide-react";

export type LinkedListVisualizerProps = {
  variables: Record<string, unknown>;
  structures?: Record<string, unknown>;
  changedCells?: number[][];
  className?: string;
};

type NodeItem = {
  id: string;
  val: any;
  nextId: string | null;
  pointers: string[];
  isTargetOf: string[]; // pointers that point here
  orderIndex: number;
};

function isListNode(v: unknown): v is { val: any; next: any } {
  return v !== null && typeof v === "object" && "val" in v && ("next" in v || (v as any).next === null);
}

const POINTER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  head: { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/40" },
  curr: { bg: "bg-primary/20", text: "text-primary", border: "border-primary/50" },
  prev: { bg: "bg-purple-500/20", text: "text-purple-300", border: "border-purple-500/40" },
  next: { bg: "bg-amber-500/20", text: "text-amber-300", border: "border-amber-500/40" },
  slow: { bg: "bg-cyan-500/20", text: "text-cyan-300", border: "border-cyan-500/40" },
  fast: { bg: "bg-rose-500/20", text: "text-rose-300", border: "border-rose-500/40" },
  tail: { bg: "bg-orange-500/20", text: "text-orange-300", border: "border-orange-500/40" },
  dummy: { bg: "bg-slate-500/20", text: "text-slate-300", border: "border-slate-500/40" },
  temp: { bg: "bg-indigo-500/20", text: "text-indigo-300", border: "border-indigo-500/40" },
};

function getPointerStyle(ptr: string) {
  const lower = ptr.toLowerCase();
  return (
    POINTER_COLORS[lower] ?? {
      bg: "bg-surface-3/80",
      text: "text-text-primary",
      border: "border-hairline",
    }
  );
}

export function LinkedListVisualizer({
  variables,
  structures = {},
  className,
}: LinkedListVisualizerProps) {
  const { nodes, nullPointers, hasCycle, activePointers } = useMemo(() => {
    const nodeMap = new Map<object, string>();
    const nodeObjMap = new Map<string, any>();
    let idCounter = 0;

    function registerNode(obj: any): string {
      if (!nodeMap.has(obj)) {
        const id = `node_${idCounter++}`;
        nodeMap.set(obj, id);
        nodeObjMap.set(id, obj);
        return id;
      }
      return nodeMap.get(obj)!;
    }

    const allVars = { ...structures, ...variables };
    const nullPtrs: string[] = [];
    const activePtrs: string[] = [];

    // Detect null pointers
    for (const [varName, varVal] of Object.entries(allVars)) {
      if (
        (varVal === null || varVal === undefined) &&
        ["prev", "curr", "next", "head", "tail", "slow", "fast", "p", "q", "p1", "p2", "l1", "l2", "dummy", "temp", "node"].includes(varName)
      ) {
        nullPtrs.push(varName);
        activePtrs.push(varName);
      }
    }

    // Traverse nodes reachable from any ListNode variable
    const initialTraverseTargets: [string, any][] = [];
    for (const [varName, varVal] of Object.entries(allVars)) {
      if (isListNode(varVal)) {
        activePtrs.push(varName);
        initialTraverseTargets.push([varName, varVal]);
      }
    }

    // Sort so head or curr is traversed first for nice linear ordering
    initialTraverseTargets.sort(([a], [b]) => {
      const order = ["head", "list", "l1", "l2", "dummy", "prev", "curr", "next"];
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });

    let detectedCycle = false;
    for (const [, startNode] of initialTraverseTargets) {
      let cur = startNode;
      const seenInPath = new Set<any>();
      while (cur && isListNode(cur)) {
        registerNode(cur);
        if (seenInPath.has(cur)) {
          detectedCycle = true;
          break;
        }
        seenInPath.add(cur);
        cur = cur.next;
      }
    }

    // Build the ordered node array
    const orderedNodes: NodeItem[] = [];
    let idx = 0;
    for (const [id, obj] of nodeObjMap.entries()) {
      const nextId = obj.next && isListNode(obj.next) ? registerNode(obj.next) : null;
      const pointers: string[] = [];

      for (const [varName, varVal] of Object.entries(allVars)) {
        if (varVal === obj) {
          pointers.push(varName);
        }
      }

      orderedNodes.push({
        id,
        val: obj.val,
        nextId,
        pointers,
        isTargetOf: [],
        orderIndex: idx++,
      });
    }

    // Sort nodes logically so next pointers flow left to right if possible
    return {
      nodes: orderedNodes,
      nullPointers: nullPtrs,
      hasCycle: detectedCycle,
      activePointers: activePtrs,
    };
  }, [variables, structures]);

  if (nodes.length === 0 && nullPointers.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2 border border-hairline text-text-tertiary">
          <Sparkles size={20} />
        </div>
        <h3 className="mt-3 text-[14px] font-medium text-foreground">Empty Linked List</h3>
        <p className="mt-1 max-w-sm text-[12.5px] text-text-secondary">
          No linked list nodes are currently instantiated in scope (head is NULL).
        </p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-5 p-4 sm:p-6 select-none", className)}>
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline/60 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
            Linked List View
          </span>
          <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 font-mono text-[11px] font-medium text-primary">
            {nodes.length} {nodes.length === 1 ? "Node" : "Nodes"}
          </span>
          {hasCycle && (
            <span className="flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 font-mono text-[11px] font-medium text-amber-400">
              <AlertTriangle size={11} />
              Cycle Detected
            </span>
          )}
        </div>

        {/* Live Pointer Legend */}
        {activePointers.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10.5px]">
            <span className="text-text-tertiary text-[10px] mr-1">Pointers:</span>
            {Array.from(new Set(activePointers)).map((ptr) => {
              const style = getPointerStyle(ptr);
              return (
                <span
                  key={ptr}
                  className={cn("rounded-[6px] border px-1.5 py-0.5 font-semibold", style.bg, style.text, style.border)}
                >
                  {ptr}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Linked List Horizontal Chain Canvas */}
      <div className="relative overflow-x-auto py-6 px-2 cv-scrollbar">
        <div className="inline-flex items-center min-w-full gap-2 sm:gap-3">
          {nodes.map((node, i) => {
            const hasPointers = node.pointers.length > 0;
            const targetNode = node.nextId ? nodes.find((n) => n.id === node.nextId) : null;
            const isBackEdge = targetNode && targetNode.orderIndex < node.orderIndex;

            return (
              <div key={node.id} className="flex items-center shrink-0">
                {/* Node Container */}
                <div className="relative flex flex-col items-center">
                  {/* Floating Pointer Badges above the node */}
                  <div className="absolute -top-10 flex flex-wrap justify-center gap-1 min-h-[24px] max-w-[120px]">
                    {node.pointers.map((ptr) => {
                      const style = getPointerStyle(ptr);
                      return (
                        <div
                          key={ptr}
                          className={cn(
                            "flex items-center gap-0.5 rounded-[6px] border px-1.5 py-0.5 font-mono text-[10.5px] font-bold shadow-[0_2px_8px_rgba(0,0,0,0.25)] animate-in fade-in zoom-in-90 duration-150",
                            style.bg,
                            style.text,
                            style.border,
                          )}
                        >
                          <span>{ptr}</span>
                          <span className="text-[9px] opacity-70">↓</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Node Body Card */}
                  <div
                    className={cn(
                      "group relative flex h-16 w-16 sm:h-[72px] sm:w-[72px] flex-col items-center justify-center rounded-[18px] border transition-all duration-200 shadow-sm",
                      hasPointers
                        ? "border-primary/60 bg-gradient-to-b from-surface-2 via-primary/10 to-surface-3 shadow-[0_0_18px_rgba(76,140,255,0.25)] ring-2 ring-primary/30 scale-105"
                        : "border-hairline bg-surface-2/90 hover:border-primary/40 hover:bg-surface-2",
                    )}
                  >
                    {/* Node Index label */}
                    <span className="absolute top-1 font-mono text-[9px] text-text-tertiary">
                      [{node.orderIndex}]
                    </span>

                    {/* Node Value */}
                    <span className="font-mono text-[18px] sm:text-[20px] font-bold text-foreground tracking-tight">
                      {typeof node.val === "object" ? JSON.stringify(node.val) : String(node.val)}
                    </span>

                    {/* Next pointer status */}
                    <span className="absolute bottom-1 font-mono text-[8.5px] text-text-tertiary">
                      .next
                    </span>
                  </div>
                </div>

                {/* Arrow / Connection to Next Node */}
                <div className="flex items-center px-1.5 sm:px-2">
                  {node.nextId ? (
                    isBackEdge ? (
                      <div className="flex flex-col items-center text-purple-400 font-mono text-[10px]">
                        <span className="rounded bg-purple-500/20 border border-purple-500/40 px-1 py-0.5 text-[9px] mb-0.5">
                          ↺ back
                        </span>
                        <CornerDownRight size={18} className="text-purple-400" />
                      </div>
                    ) : (
                      <div className="flex items-center text-primary/80">
                        <div className="h-[2px] w-5 sm:w-8 bg-gradient-to-r from-primary/60 to-primary" />
                        <ArrowRight size={16} className="-ml-1.5 text-primary" />
                      </div>
                    )
                  ) : (
                    <div className="flex items-center text-text-tertiary/70">
                      <div className="h-[2px] w-4 sm:w-6 bg-border" />
                      <ArrowRight size={14} className="-ml-1 text-text-tertiary/70" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* NULL Sentinel Terminator */}
          <div className="relative flex flex-col items-center shrink-0">
            {/* Null Pointers floating above NULL */}
            <div className="absolute -top-10 flex flex-wrap justify-center gap-1 min-h-[24px] max-w-[120px]">
              {nullPointers.map((ptr) => {
                const style = getPointerStyle(ptr);
                return (
                  <div
                    key={ptr}
                    className={cn(
                      "flex items-center gap-0.5 rounded-[6px] border px-1.5 py-0.5 font-mono text-[10.5px] font-bold shadow-sm animate-in fade-in zoom-in-90 duration-150",
                      style.bg,
                      style.text,
                      style.border,
                    )}
                  >
                    <span>{ptr}</span>
                    <span className="text-[9px] opacity-70">↓</span>
                  </div>
                );
              })}
            </div>

            {/* NULL Block */}
            <div
              className={cn(
                "flex h-14 w-16 sm:h-16 sm:w-20 flex-col items-center justify-center rounded-[16px] border border-dashed border-hairline/80 bg-surface-1/60 font-mono text-text-tertiary transition-colors",
                nullPointers.length > 0 && "border-primary/40 bg-primary/5 text-text-secondary",
              )}
            >
              <span className="text-[12px] font-semibold tracking-wider">NULL</span>
              <span className="text-[9px] opacity-60">⊘ null</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
