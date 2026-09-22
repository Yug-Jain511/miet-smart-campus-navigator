// Public routing API used by the UI. The UI must never run Dijkstra directly.
// Returns null when no walking route exists.

import type { NavigationGraph, RouteResult } from '../../models/types';
import { dijkstra, reconstructPath } from './dijkstra';
import { buildDirections } from './directionService';
import { computeEdgeWeight, type RouteWeightOptions } from './routeWeights';
import { walkingTimeSeconds } from './walkingTime';

function edgeDistanceBetween(graph: NavigationGraph, from: string, to: string): number {
  const edge = graph.edges.find(
    (e) =>
      !e.blocked &&
      ((e.from === from && e.to === to) || (e.from === to && e.to === from)),
  );
  return edge ? edge.distanceMeters : 0;
}

/**
 * Find the shortest walking route between two navigation nodes.
 * Same-node → zero-distance "already here" result (UI shows friendly message).
 * weightOpts enables future penalties; default = pure distance (MVP).
 * nameOf resolves display names (dataset-driven); defaults to the demo table.
 */
export function findRoute(
  sourceNodeId: string,
  destinationNodeId: string,
  graph: NavigationGraph,
  weightOpts: RouteWeightOptions = {},
  nameOf?: (locationId: string | undefined, fallback: string) => string,
): RouteResult | null {
  const nodeIds = new Set(graph.nodes.map((n) => n.id));
  if (!nodeIds.has(sourceNodeId) || !nodeIds.has(destinationNodeId)) {
    return null; // invalid node → handled as "no route" by callers
  }

  if (sourceNodeId === destinationNodeId) {
    const node = graph.nodes.find((n) => n.id === sourceNodeId);
    const locId = node?.locationId ?? sourceNodeId;
    return {
      nodeIds: [sourceNodeId],
      locationIds: [locId],
      totalDistanceMeters: 0,
      estimatedWalkingTimeSeconds: 0,
      directions: buildDirections([sourceNodeId], graph.nodes, () => 0, nameOf),
    };
  }

  let distances: Record<string, number>;
  let previous: Record<string, string | null>;
  try {
    ({ distances, previous } = dijkstra(sourceNodeId, graph, (e) =>
      computeEdgeWeight(e, weightOpts),
    ));
  } catch {
    return null;
  }

  const path = reconstructPath(previous, distances, sourceNodeId, destinationNodeId);
  if (!path) return null;

  // Report RAW meters along the chosen path (weights only select the path,
  // so penalties never inflate the displayed distance / walking time).
  let totalDistanceMeters = 0;
  for (let i = 0; i < path.length - 1; i++) {
    totalDistanceMeters += edgeDistanceBetween(graph, path[i]!, path[i + 1]!);
  }
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  const locationIds = path.map((id) => byId.get(id)?.locationId ?? id);

  return {
    nodeIds: path,
    locationIds,
    totalDistanceMeters,
    estimatedWalkingTimeSeconds: walkingTimeSeconds(totalDistanceMeters),
    directions: buildDirections(
      path,
      graph.nodes,
      (a, b) => edgeDistanceBetween(graph, a, b),
      nameOf,
    ),
  };
}
