import type { ExecutionEvent, CallFrame } from "@/types/execution";
import { TraceBuilder, change } from "./helpers";

/**
 * Depth-First Search trace.
 * Tracks recursive callstack, visited list, and active traversal path.
 */
export function dfsTrace(
  graph: number[][] = [[1, 2], [0, 3, 4], [0], [1], [1]],
  start = 0,
): ExecutionEvent[] {
  const t = new TraceBuilder();
  const seen = new Set<number>();
  const visitedOrder: number[] = [];
  const frames: CallFrame[] = [];
  let frameCounter = 0;

  const snap = () => ({
    visited: [...visitedOrder],
  });

  function dfsUtil(node: number, parentId: string | null, depth: number) {
    const frameId = `f${++frameCounter}`;
    const frame: CallFrame = {
      id: frameId,
      label: `dfs(${node})`,
      depth,
      parentId,
      status: "active",
    };
    frames.push(frame);

    seen.add(node);
    visitedOrder.push(node);

    t.push({
      line: 2,
      variables: { node, depth, visitedCount: seen.size },
      changes: [change("visited", [visitedOrder.length - 1], null, node)],
      snapshots: snap(),
      callstack: frames.map((f) => ({ ...f })),
      pointers: { current: [visitedOrder.length - 1] },
      explanation: `Visit node ${node} at depth ${depth}. Add to visited set.`,
    });

    const neighbors = graph[node] ?? [];
    for (const nxt of neighbors) {
      const isUnvisited = !seen.has(nxt);
      t.push({
        line: 4,
        variables: { node, nxt, isUnvisited },
        changes: [],
        snapshots: snap(),
        callstack: frames.map((f) => ({ ...f })),
        pointers: { current: [visitedOrder.length - 1] },
        explanation: `From node ${node}, check edge to neighbor ${nxt} (${isUnvisited ? "explore deeper" : "already visited"}).`,
      });

      if (isUnvisited) {
        dfsUtil(nxt, frameId, depth + 1);
      }
    }

    frame.status = "returned";
    t.push({
      line: 7,
      variables: { node, depth },
      changes: [],
      snapshots: snap(),
      callstack: frames.map((f) => ({ ...f })),
      pointers: { current: [visitedOrder.length - 1] },
      explanation: `Finished exploring all branches from node ${node}. Backtrack.`,
    });
  }

  dfsUtil(start, null, 0);

  t.push({
    line: 8,
    variables: { totalVisited: visitedOrder.length },
    changes: [],
    snapshots: snap(),
    callstack: frames.map((f) => ({ ...f })),
    pointers: {},
    explanation: `DFS traversal complete. Visited nodes: [${visitedOrder.join(", ")}].`,
  });

  return t.build();
}
