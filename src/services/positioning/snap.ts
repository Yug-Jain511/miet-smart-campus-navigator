// Segment-first GPS snapping with a configurable threshold gate.
// NEVER blindly snap to the nearest node: we measure distance to the nearest
// valid path segment first, and only snap when within maxSnapMeters.
// Map-plane units are converted to meters via the graph's own edge lengths.

import type { NavigationGraph, NavigationNode } from '../../models/types';
import { DEFAULT_MAX_SNAP_METERS } from './types';

export type NearestSegment = {
  edgeId: string;
  from: string;
  to: string;
  nearestX: number;
  nearestY: number;
  /** Distance in map-plane units. */
  distanceMapUnits: number;
  /** Distance converted to meters via graph scale. */
  distanceMeters: number;
};

/** Meters per map-plane unit, averaged over measurable edges. */
export function computeMapScale(graph: NavigationGraph): number {
  const byId = new Map<string, NavigationNode>(graph.nodes.map((n) => [n.id, n]));
  let distSum = 0;
  let lenSum = 0;
  for (const e of graph.edges) {
    const a = byId.get(e.from);
    const b = byId.get(e.to);
    if (!a || !b) continue;
    const len = Math.hypot((b.x ?? 0) - (a.x ?? 0), (b.y ?? 0) - (a.y ?? 0));
    if (len > 1e-9 && e.distanceMeters > 0) {
      distSum += e.distanceMeters;
      lenSum += len;
    }
  }
  if (lenSum <= 0) return 1; // degenerate graph — treat 1 unit as 1 m
  return distSum / lenSum;
}

function nearestOnSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): { x: number; y: number; dist: number } {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-12) {
    return { x: ax, y: ay, dist: Math.hypot(px - ax, py - ay) };
  }
  const t = Math.min(1, Math.max(0, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  const x = ax + t * dx;
  const y = ay + t * dy;
  return { x, y, dist: Math.hypot(px - x, py - y) };
}

/**
 * Nearest UNBLOCKED path segment to a map-plane point.
 * Blocked edges are never snap targets.
 */
export function findNearestSegment(
  mapX: number,
  mapY: number,
  graph: NavigationGraph,
): NearestSegment | null {
  const byId = new Map<string, NavigationNode>(graph.nodes.map((n) => [n.id, n]));
  const scale = computeMapScale(graph);
  let best: NearestSegment | null = null;
  for (const e of graph.edges) {
    if (e.blocked) continue;
    const a = byId.get(e.from);
    const b = byId.get(e.to);
    if (!a || !b) continue;
    const n = nearestOnSegment(mapX, mapY, a.x ?? 0, a.y ?? 0, b.x ?? 0, b.y ?? 0);
    if (!best || n.dist < best.distanceMapUnits) {
      best = {
        edgeId: e.id,
        from: e.from,
        to: e.to,
        nearestX: n.x,
        nearestY: n.y,
        distanceMapUnits: n.dist,
        distanceMeters: n.dist * scale,
      };
    }
  }
  return best;
}

export type SnapDecision =
  | {
      snapped: true;
      nodeId: string;
      locationId?: string;
      nearestX: number;
      nearestY: number;
      distanceMeters: number;
      edgeId: string;
    }
  | { snapped: false; distanceMeters: number | null };

/**
 * Snap gate: snap to the nearer endpoint of the nearest segment
 * ONLY when within maxSnapMeters. Otherwise report the miss distance
 * so callers can show raw position + low confidence.
 */
export function snapToGraph(
  mapX: number,
  mapY: number,
  graph: NavigationGraph,
  maxSnapMeters: number = DEFAULT_MAX_SNAP_METERS,
): SnapDecision {
  const seg = findNearestSegment(mapX, mapY, graph);
  if (!seg) return { snapped: false, distanceMeters: null };
  if (seg.distanceMeters > maxSnapMeters) {
    return { snapped: false, distanceMeters: seg.distanceMeters };
  }
  const byId = new Map<string, NavigationNode>(graph.nodes.map((n) => [n.id, n]));
  const a = byId.get(seg.from)!;
  const b = byId.get(seg.to)!;
  const da = Math.hypot(mapX - (a.x ?? 0), mapY - (a.y ?? 0));
  const db = Math.hypot(mapX - (b.x ?? 0), mapY - (b.y ?? 0));
  const winner = da <= db ? a : b;
  return {
    snapped: true,
    nodeId: winner.id,
    locationId: winner.locationId,
    nearestX: seg.nearestX,
    nearestY: seg.nearestY,
    distanceMeters: seg.distanceMeters,
    edgeId: seg.edgeId,
  };
}

/** Distance from a map point to a polyline (route), in meters. Shared by off-route. */
export function distanceToPolylineMeters(
  mapX: number,
  mapY: number,
  polyline: Array<{ x: number; y: number }>,
  graph: NavigationGraph,
): number {
  if (polyline.length === 0) return Infinity;
  if (polyline.length === 1) {
    const p = polyline[0]!;
    return Math.hypot(mapX - p.x, mapY - p.y) * computeMapScale(graph);
  }
  const scale = computeMapScale(graph);
  let best = Infinity;
  for (let i = 0; i < polyline.length - 1; i++) {
    const a = polyline[i]!;
    const b = polyline[i + 1]!;
    const n = nearestOnSegment(mapX, mapY, a.x, a.y, b.x, b.y);
    if (n.dist < best) best = n.dist;
  }
  return best * scale;
}
