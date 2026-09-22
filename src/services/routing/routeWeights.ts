// Route weight model: single configurable scoring function for Dijkstra.
// MVP uses distance only; penalties are stored and ready for real data.
// score = distanceMeters + accessibilityPenalty + congestionPenalty (+∞ if blocked)

import type { NavigationEdge } from '../../models/types';

export type RouteWeightOptions = {
  /** Added meters when edge.accessible === false. Default 0 (no effect until used). */
  accessibilityPenaltyMeters?: number;
  /** Reserved for future crowd-aware routing. Must stay 0 in MVP. */
  congestionPenaltyMeters?: number;
};

/** Reserved: congestion must not affect MVP routes. */
export const MVP_CONGESTION_PENALTY = 0;

export function computeEdgeWeight(
  edge: NavigationEdge,
  opts: RouteWeightOptions = {},
): number {
  if (edge.blocked) return Infinity;
  const accessPenalty =
    edge.accessible === false ? (opts.accessibilityPenaltyMeters ?? 0) : 0;
  const congestion = opts.congestionPenaltyMeters ?? MVP_CONGESTION_PENALTY;
  return edge.distanceMeters + accessPenalty + congestion;
}

/** Future route kinds. MVP UI exposes only 'shortest'. */
export type RouteKind = 'shortest' | 'fastest' | 'accessible';

export function defaultWeightOptionsFor(kind: RouteKind): RouteWeightOptions {
  switch (kind) {
    case 'accessible':
      return { accessibilityPenaltyMeters: 500 };
    case 'fastest':
    case 'shortest':
    default:
      return {};
  }
}
