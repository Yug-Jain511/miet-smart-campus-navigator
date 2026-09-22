// Shared CRS.Simple helpers. Demo plane is 0–1000 on both axes.
// Leaflet LatLng is [lat, lng]; we render demo (x,y) as [1000 - y, x]
// so LIBRARY (y=180) appears at the top like the spec sketch.
//
// CONVENTION (entire app): every Leaflet position flows through toLatLng.
// Never feed mapX/mapY or lat/lng directly into Leaflet components.

import type { NavigationNode } from '../../models/types';

export const CAMPUS_BOUNDS: [[number, number], [number, number]] = [
  [0, 0],
  [1000, 1000],
];

export function toLatLng(x = 0, y = 0): [number, number] {
  return [1000 - y, x];
}

/** Inverse: Leaflet click lat/lng → demo map coords. */
export function fromLatLng(lat: number, lng: number): { mapX: number; mapY: number } {
  return { mapX: lng, mapY: 1000 - lat };
}

/**
 * Ordered Leaflet coordinates for a route. Single source of truth for
 * RouteLayer, route-fit bounds, and Admin route-debug output.
 */
export function routeToLatLngs(
  nodeIds: string[],
  nodes: NavigationNode[],
): Array<[number, number]> {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  return nodeIds.map((id) => {
    const n = byId.get(id);
    return toLatLng(n?.x, n?.y);
  });
}
