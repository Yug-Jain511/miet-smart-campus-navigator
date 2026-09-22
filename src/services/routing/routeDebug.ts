// Development route diagnostics. No-op in production builds.
// Call when a route computes AND when it fails — the console then shows
// exactly where the chain broke: source loc/node, dest loc/node, nodeIds,
// converted Leaflet coords, totals, or the error.

export type RouteDebugInfo = {
  sourceLocation: string | null;
  sourceNode: string | null;
  destinationLocation: string | null;
  destinationNode: string | null;
  nodeIds: string[] | null;
  routeCoords: Array<[number, number]> | null;
  distanceMeters: number | null;
  etaSeconds: number | null;
  routeError: string | null;
};

export function logRouteDebug(info: RouteDebugInfo): void {
  if (!import.meta.env.DEV) return;
  // eslint-disable-next-line no-console
  console.debug('[route-debug]', info);
}
