// Live-navigation primitives. Separate from route preview on purpose:
// startNavigation() / recalculateRoute() / isOffRoute() / getNearestRoutePoint()
// Off-route uses REAL geometric distance to the route polyline — never faked.

import type { NavigationGraph, RouteResult } from '../../models/types';
import { computeMapScale, distanceToPolylineMeters } from '../positioning/snap';
import { findRoute } from '../routing/routeService';
import type { RouteWeightOptions } from '../routing/routeWeights';
import { walkingTimeSeconds } from '../routing/walkingTime';

export type RoutePoint = { x: number; y: number };

/** Ordered map-plane points of a route (for rendering + geometry). */
export function routePolyline(route: RouteResult, graph: NavigationGraph): RoutePoint[] {
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  return route.nodeIds.map((id) => {
    const n = byId.get(id);
    return { x: n?.x ?? 0, y: n?.y ?? 0 };
  });
}

/** Closest point on the route polyline + its segment index. */
export function getNearestRoutePoint(
  mapX: number,
  mapY: number,
  polyline: RoutePoint[],
): { x: number; y: number; segmentIndex: number; distanceMapUnits: number } {
  let best = { x: polyline[0]?.x ?? 0, y: polyline[0]?.y ?? 0, segmentIndex: 0, distanceMapUnits: Infinity };
  if (polyline.length < 2) {
    if (polyline.length === 1) {
      best.distanceMapUnits = Math.hypot(mapX - best.x, mapY - best.y);
    }
    return best;
  }
  for (let i = 0; i < polyline.length - 1; i++) {
    const a = polyline[i]!;
    const b = polyline[i + 1]!;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;
    const t =
      lenSq < 1e-12 ? 0 : Math.min(1, Math.max(0, ((mapX - a.x) * dx + (mapY - a.y) * dy) / lenSq));
    const x = a.x + t * dx;
    const y = a.y + t * dy;
    const dist = Math.hypot(mapX - x, mapY - y);
    if (dist < best.distanceMapUnits) {
      best = { x, y, segmentIndex: i, distanceMapUnits: dist };
    }
  }
  return best;
}

/** True when the position is farther than thresholdMeters from the route. */
export function isOffRoute(
  mapX: number,
  mapY: number,
  route: RouteResult,
  graph: NavigationGraph,
  thresholdMeters: number,
): boolean {
  return (
    distanceToPolylineMeters(mapX, mapY, routePolyline(route, graph), graph) > thresholdMeters
  );
}

export type RemainingInfo = {
  remainingMeters: number;
  remainingSeconds: number;
  /** Next vertex name + distance, e.g. "Continue towards Library (80 m)". */
  nextInstruction: string;
  arrived: boolean;
};

/**
 * Remaining distance/time measured along the route from the nearest
 * route point (map geometry × graph scale). Arrived within ~10 m of the end.
 */
export function remainingRouteInfo(
  mapX: number,
  mapY: number,
  route: RouteResult,
  graph: NavigationGraph,
  vertexName: (nodeId: string) => string,
  arrivedWithinMeters = 10,
): RemainingInfo {
  const poly = routePolyline(route, graph);
  const scale = computeMapScale(graph);
  const near = getNearestRoutePoint(mapX, mapY, poly);

  let remainingUnits = 0;
  if (poly.length >= 2) {
    const b = poly[near.segmentIndex + 1]!;
    remainingUnits += Math.hypot(b.x - near.x, b.y - near.y);
    for (let i = near.segmentIndex + 1; i < poly.length - 1; i++) {
      remainingUnits += Math.hypot(poly[i + 1]!.x - poly[i]!.x, poly[i + 1]!.y - poly[i]!.y);
    }
  }
  const remainingMeters = remainingUnits * scale;
  const arrived = remainingMeters <= arrivedWithinMeters;
  const nextNodeId = route.nodeIds[Math.min(near.segmentIndex + 1, route.nodeIds.length - 1)]!;
  const legMeters = Math.max(0, remainingMeters);
  return {
    remainingMeters,
    remainingSeconds: walkingTimeSeconds(remainingMeters),
    nextInstruction: arrived
      ? `You have arrived at ${vertexName(route.nodeIds[route.nodeIds.length - 1]!)}.`
      : `Continue towards ${vertexName(nextNodeId)}${legMeters >= 20 ? ` for about ${Math.round(legMeters)} m` : ''}.`,
    arrived,
  };
}

/** Best route from a new position node (used by Recalculate). */
export function recalculateRoute(
  fromNodeId: string,
  toNodeId: string,
  graph: NavigationGraph,
  weightOpts: RouteWeightOptions = {},
): RouteResult | null {
  return findRoute(fromNodeId, toNodeId, graph, weightOpts);
}
