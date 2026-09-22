// Dijkstra's shortest-path algorithm over the campus navigation graph.
// Beginner-friendly: small graph, plain arrays, edge weight = distanceMeters.
// Blocked edges are ignored. Graph is treated as undirected (walk both ways).

import type { NavigationEdge, NavigationGraph } from '../../models/types';

export type DijkstraOutput = {
  /** Shortest distance in meters from source to every node. */
  distances: Record<string, number>;
  /** Predecessor node for path reconstruction. */
  previous: Record<string, string | null>;
};

/** Default weight: raw distance; blocked edges are impassable. */
export function defaultEdgeWeight(edge: NavigationEdge): number {
  if (edge.blocked) return Infinity;
  return edge.distanceMeters;
}

/**
 * Run Dijkstra from sourceNodeId.
 * Throws if the source node does not exist.
 * weightFn scores edges (default = distanceMeters, blocked = impassable).
 */
export function dijkstra(
  sourceNodeId: string,
  graph: NavigationGraph,
  weightFn: (edge: NavigationEdge) => number = defaultEdgeWeight,
): DijkstraOutput {
  const nodeIds = new Set(graph.nodes.map((n) => n.id));
  if (!nodeIds.has(sourceNodeId)) {
    throw new Error(`Unknown source node: ${sourceNodeId}`);
  }

  // Build adjacency list, skipping impassable edges.
  const adjacency = new Map<string, Array<{ to: string; weight: number }>>();
  for (const n of graph.nodes) adjacency.set(n.id, []);
  for (const e of graph.edges) {
    const weight = weightFn(e);
    if (!(weight >= 0) || weight === Infinity) continue;
    if (!nodeIds.has(e.from) || !nodeIds.has(e.to)) continue;
    if (!(e.distanceMeters >= 0)) continue;
    adjacency.get(e.from)!.push({ to: e.to, weight });
    adjacency.get(e.to)!.push({ to: e.from, weight });
  }

  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const visited = new Set<string>();
  for (const n of graph.nodes) {
    distances[n.id] = Infinity;
    previous[n.id] = null;
  }
  distances[sourceNodeId] = 0;

  // O(V^2) loop is fine for a tiny campus graph and easy to read.
  for (let i = 0; i < graph.nodes.length; i++) {
    // Pick the unvisited node with the smallest tentative distance.
    let current: string | null = null;
    let best = Infinity;
    for (const n of graph.nodes) {
      if (!visited.has(n.id) && distances[n.id] < best) {
        best = distances[n.id];
        current = n.id;
      }
    }
    if (current === null || best === Infinity) break; // remaining nodes unreachable
    visited.add(current);

    for (const { to, weight } of adjacency.get(current)!) {
      const candidate = distances[current] + weight;
      if (candidate < distances[to]) {
        distances[to] = candidate;
        previous[to] = current;
      }
    }
  }

  return { distances, previous };
}

/** Reconstruct the node-id path from source to destination. Returns null if unreachable. */
export function reconstructPath(
  previous: Record<string, string | null>,
  distances: Record<string, number>,
  sourceNodeId: string,
  destinationNodeId: string,
): string[] | null {
  if (!(destinationNodeId in distances)) return null;
  if (distances[destinationNodeId] === Infinity) return null;
  const path: string[] = [];
  let current: string | null = destinationNodeId;
  while (current !== null) {
    path.unshift(current);
    if (current === sourceNodeId) return path;
    current = previous[current] ?? null;
  }
  return null;
}
