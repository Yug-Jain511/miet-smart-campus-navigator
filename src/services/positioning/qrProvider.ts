// QR positioning: deterministic. A scanned QR IS the location.
// Takes lookup fns so real datasets can replace demo data without edits here.

import { nodeIdForLocation } from '../../data/demoCampus';
import { getLocationById } from '../../data/demoCampus/locations';
import type { PositionFix } from './types';

export function qrFixForLocation(locationId: string): PositionFix | null {
  const loc = getLocationById(locationId);
  if (!loc) return null;
  return {
    source: 'qr',
    confidence: 'confirmed',
    locationId: loc.id,
    nodeId: nodeIdForLocation(loc.id),
    mapX: loc.mapX,
    mapY: loc.mapY,
    note: `Location confirmed by QR: ${loc.name}.`,
  };
}
