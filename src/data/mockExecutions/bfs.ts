import type { ExecutionEvent } from "@/types/execution";
import { TraceBuilder, change } from "./helpers";

/**
 * Breadth-First Search trace.
 * Tracks queue, visited set, and traversal order.
 */
export function bfsTrace(
  graph: number[][] = [[1, 2], [0, 3, 4], [0], [1], [1]],
  start = 0,
): ExecutionEvent[] {
  const t = new TraceBuilder();
  const queue: number[] = [start];
  const seen = new Set<number>([start]);
  const order: number[] = [];

  const snap = () => ({
    order: [...order],
    queue: [...queue],
    seen: Array.from(seen),
  });

  t.push({
    line: 2,
    variables: { start, "queue.length": queue.length },
    changes: [],
    snapshots: snap(),
    pointers: { start: [0] },
    explanation: `Initialize BFS: add start node ${start} to queue and mark as seen.`,
  });

  while (queue.length > 0) {
    const node = queue.shift()!;
    order.push(node);

    t.push({
      line: 6,
      variables: { node, "queue.length": queue.length, order: [...order] },
      changes: [change("order", [order.length - 1], null, node)],
      snapshots: snap(),
      pointers: { node: [order.length - 1] },
      highlighted: [{ structure: "order", path: [order.length - 1] }],
      explanation: `Dequeue node ${node} and record in traversal order.`,
    });

    const neighbors = graph[node] ?? [];
    for (const nxt of neighbors) {
      const isUnvisited = !seen.has(nxt);
      t.push({
        line: 9,
        variables: { node, nxt, isUnvisited },
        changes: [],
        snapshots: snap(),
        pointers: { node: [order.length - 1] },
        explanation: `Inspect edge from ${node} to neighbor ${nxt} (${isUnvisited ? "unvisited" : "already seen"}).`,
      });

      if (isUnvisited) {
        seen.add(nxt);
        queue.push(nxt);

        t.push({
          line: 12,
          variables: { node, nxt, "queue.length": queue.length },
          changes: [
            change("queue", [queue.length - 1], null, nxt),
            change("seen", [seen.size - 1], null, nxt),
          ],
          snapshots: snap(),
          pointers: { next: [queue.length - 1] },
          explanation: `Mark neighbor ${nxt} as seen and push into queue.`,
        });
      }
    }
  }

  t.push({
    line: 13,
    variables: { "order.length": order.length },
    changes: [],
    snapshots: snap(),
    pointers: {},
    explanation: `BFS traversal finished. Visited all reachable nodes: [${order.join(", ")}].`,
  });

  return t.build();
}
