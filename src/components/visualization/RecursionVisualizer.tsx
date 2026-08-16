import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { EmptyState, Pill } from "@/components/ui/cv";
import type { CallFrame } from "@/types/execution";

export type RecursionVisualizerProps = {
  frames: CallFrame[];
  activeId?: string | undefined;
  memoHits?: string[] | undefined;
};

type Node = CallFrame & { children: Node[]; depth: number };

function buildTree(frames: CallFrame[]): Node[] {
  const map = new Map<string, Node>();
  for (const f of frames) map.set(f.id, { ...f, children: [], depth: 0 });
  const roots: Node[] = [];
  for (const f of frames) {
    const node = map.get(f.id)!;
    const parent = f.parentId ? map.get(f.parentId) : undefined;
    if (parent) {
      node.depth = parent.depth + 1;
      parent.children.push(node);
    } else roots.push(node);
  }
  return roots;
}

function NodeRow({
  node,
  activeId,
  memoHits,
}: {
  node: Node;
  activeId?: string | undefined;
  memoHits?: string[] | undefined;
}) {
  const active = node.id === activeId;
  const memo = memoHits?.includes(node.id);
  const returned = node.returnValue !== undefined && node.returnValue !== null;

  return (
    <li className="relative pl-5">
      <span className="absolute left-0 top-4 h-px w-4 bg-hairline" aria-hidden />
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-[9px] border px-2.5 py-1.5 font-mono text-[12.5px] transition-colors duration-150",
          active
            ? "border-primary bg-primary/12 text-foreground"
            : memo
              ? "border-[var(--viz-dep)] bg-[color-mix(in_oklab,var(--viz-dep)_10%,transparent)] text-text-secondary"
              : returned
                ? "border-hairline bg-surface-1 text-text-secondary"
                : "border-dashed border-hairline-strong bg-surface-1/50 text-text-tertiary",
        )}
      >
        <span>{node.label}</span>
        {returned ? (
          <span className="text-[var(--viz-insert)]">→ {String(node.returnValue)}</span>
        ) : (
          <span className="text-text-tertiary">…</span>
        )}
        {memo ? <span className="text-[10.5px] text-[var(--viz-dep)]">memo</span> : null}
      </div>
      {node.children.length ? (
        <ul className="ml-1 mt-1.5 space-y-1.5 border-l border-hairline">
          {node.children.map((c) => (
            <NodeRow key={c.id} node={c} activeId={activeId} memoHits={memoHits} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function RecursionVisualizer({ frames, activeId, memoHits }: RecursionVisualizerProps) {
  const roots = useMemo(() => buildTree(frames), [frames]);
  const stack = useMemo(
    () => frames.filter((f) => f.returnValue === undefined || f.returnValue === null),
    [frames],
  );

  if (!frames.length) {
    return (
      <EmptyState
        title="No calls yet"
        description="Run Visualize to watch the call tree unfold, one frame at a time."
      />
    );
  }

  return (
    <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1fr)_220px]">
      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[12px] text-text-secondary">call tree</span>
          <Pill>{frames.length} frames</Pill>
        </div>
        <ul className="space-y-1.5">
          {roots.map((r) => (
            <NodeRow key={r.id} node={r} activeId={activeId} memoHits={memoHits} />
          ))}
        </ul>
      </div>

      <div>
        <p className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-text-tertiary">
          Call stack
        </p>
        <div className="flex flex-col gap-1.5">
          {[...stack].reverse().map((f, i) => (
            <div
              key={f.id}
              className={cn(
                "rounded-[8px] border px-2.5 py-1.5 font-mono text-[12px]",
                i === 0
                  ? "border-primary/60 bg-primary/10 text-foreground"
                  : "border-hairline bg-surface-1 text-text-tertiary",
              )}
            >
              {f.label}
            </div>
          ))}
          {!stack.length ? (
            <p className="font-mono text-[12px] text-text-tertiary">stack empty — returned</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}