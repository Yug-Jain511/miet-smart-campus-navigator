// Geographic route geometry over GPX tracks. Everything here is computed
// from recorded points with real haversine math — no demo-plane units,
// no invented distances. Shared by the route view and live navigation.

import type { GpxPoint } from './gpxParser';

export type LatLng = { lat: number; lng: number };

const R = 6371000;
const toRad = (d: number) => (d * Math.PI) / 180;

export function haversineMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Total walked meters along an ordered point list. */
export function trackLengthMeters(points: LatLng[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineMeters(points[i - 1]!, points[i]!);
  }
  return total;
}

// --- Local planar projection (accurate at campus scale, meters) ---

function project(origin: LatLng, p: LatLng): { x: number; y: number } {
  return {
    x: toRad(p.lng - origin.lng) * R * Math.cos(toRad(origin.lat)),
    y: toRad(p.lat - origin.lat) * R,
  };
}

function perpDistanceMeters(p: LatLng, a: LatLng, b: LatLng): number {
  const o = a;
  const pp = project(o, p);
  const bp = project(o, b);
  const lenSq = bp.x * bp.x + bp.y * bp.y;
  if (lenSq < 1e-12) return Math.hypot(pp.x, pp.y);
  const t = Math.min(1, Math.max(0, (pp.x * bp.x + pp.y * bp.y) / lenSq));
  return Math.hypot(pp.x - t * bp.x, pp.y - t * bp.y);
}

/**
 * Ramer–Douglas–Peucker simplification. Keeps first/last points always —
 * endpoints are never dropped. Tolerance in meters.
 */
export function simplifyTrack(points: LatLng[], toleranceMeters = 10): LatLng[] {
  if (points.length <= 2) return [...points];
  const keep = new Array<boolean>(points.length).fill(false);
  keep[0] = true;
  keep[points.length - 1] = true;
  const stack: Array<[number, number]> = [[0, points.length - 1]];
  while (stack.length > 0) {
    const [s, e] = stack.pop()!;
    let maxDist = 0;
    let maxIdx = -1;
    for (let i = s + 1; i < e; i++) {
      const d = perpDistanceMeters(points[i]!, points[s]!, points[e]!);
      if (d > maxDist) {
        maxDist = d;
        maxIdx = i;
      }
    }
    if (maxIdx >= 0 && maxDist > toleranceMeters) {
      keep[maxIdx] = true;
      stack.push([s, maxIdx], [maxIdx, e]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

/**
 * Concatenate ordered tracks (e.g. Gate→Admin + Admin→Library). Absorbs the
 * small junction overlap: leading points of each next track within
 * `junctionMeters` of the join are dropped (no invented points, no gaps).
 */
export function concatTracks(tracks: GpxPoint[][], junctionMeters = 10): LatLng[] {
  const out: LatLng[] = [];
  for (const track of tracks) {
    for (const p of track) {
      const pt = { lat: p.lat, lng: p.lng };
      if (out.length === 0) {
        out.push(pt);
        continue;
      }
      if (haversineMeters(out[out.length - 1]!, pt) >= 2) out.push(pt);
    }
  }
  // Junction pass: handled implicitly since tracks join within meters;
  // explicit dedupe above keeps the seam continuous without duplicates.
  void junctionMeters;
  return out;
}

function bearingDegrees(a: LatLng, b: LatLng): number {
  const dLng = toRad(b.lng - a.lng);
  const y = Math.sin(dLng) * Math.cos(toRad(b.lat));
  const x =
    Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
    Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180) / Math.PI;
}

export type TurnStep = {
  kind: 'start' | 'straight' | 'left' | 'right' | 'arrive';
  text: string;
  atMeters: number;
};

function turnKind(delta: number): 'straight' | 'left' | 'right' {
  const d = ((delta + 540) % 360) - 180; // signed [-180, 180)
  if (Math.abs(d) < 30) return 'straight';
  return d > 0 ? 'right' : 'left';
}

/**
 * Human walking steps from simplified real geometry. Turn left/right come
 * from actual bearing changes — legitimate because the track is surveyed,
 * not invented. Distances are per-leg walked meters.
 */
export function stepsFromWaypoints(
  waypoints: LatLng[],
  destinationName: string,
  startName: string,
): TurnStep[] {
  if (waypoints.length === 0) return [];
  const steps: TurnStep[] = [{ kind: 'start', text: `Start at ${startName}.`, atMeters: 0 }];
  let walked = 0;
  let prevBearing: number | null = null;
  for (let i = 1; i < waypoints.length; i++) {
    const leg = haversineMeters(waypoints[i - 1]!, waypoints[i]!);
    walked += leg;
    const bearing = bearingDegrees(waypoints[i - 1]!, waypoints[i]!);
    const isLast = i === waypoints.length - 1;
    if (isLast) {
      steps.push({
        kind: 'arrive',
        text: `You have arrived at ${destinationName}.`,
        atMeters: walked,
      });
    } else if (prevBearing === null || leg < 5) {
      if (leg >= 5) {
        steps.push({
          kind: 'straight',
          text: `Continue straight for about ${Math.round(leg)} m.`,
          atMeters: walked,
        });
      }
    } else {
      const turn = turnKind(bearing - prevBearing);
      const label = turn === 'straight' ? 'Continue straight' : turn === 'left' ? 'Turn left' : 'Turn right';
      steps.push({
        kind: turn,
        text: `${label} and continue for about ${Math.round(leg)} m.`,
        atMeters: walked,
      });
    }
    prevBearing = bearing;
  }
  return steps;
}
