// Manual positioning: user taps the map → snap to nearest valid path
// within the threshold. Far taps stay raw with low confidence.

import type { NavigationGraph } from '../../models/types';
import { snapToGraph } from './snap';
import { DEFAULT_MAX_SNAP_METERS, type PositionFix } from './types';

export function manualFixForPoint(
  mapX: number,
  mapY: number,
  graph: NavigationGraph,
  maxSnapMeters: number = DEFAULT_MAX_SNAP_METERS,
): PositionFix {
  const snap = snapToGraph(mapX, mapY, graph, maxSnapMeters);
  if (snap.snapped) {
    return {
      source: 'manual',
      confidence: 'estimated',
      locationId: snap.locationId,
      nodeId: snap.nodeId,
      mapX: snap.nearestX,
      mapY: snap.nearestY,
      distanceToPathMeters: snap.distanceMeters,
      note: `Snapped to nearest path (about ${Math.round(snap.distanceMeters)} m away).`,
    };
  }
  return {
    source: 'manual',
    confidence: 'low',
    mapX,
    mapY,
    distanceToPathMeters: snap.distanceMeters ?? undefined,
    note: 'That point is far from known paths. Try a QR code or tap closer to a walkway.',
  };
}
