// Live navigation against REAL GPX tracks (lat/lng, meters).
// Parallel to the demo-plane navigationService — same honest rules:
// real geometric distance, no fabricated positions. Dijkstra untouched.

import { haversineMeters, type LatLng } from '../routes/gpxGeometry';

export type TrackSnap = {
  /** Closest point on the track. */
  point: LatLng;
  /** Index of the segment start the point lies on. */
  segmentIndex: number;
  distanceMeters: number;
};

/** Closest point on the walked track + how far off it the position is. */
export function snapToTrack(pos: LatLng, track: LatLng[]): TrackSnap | null {
  if (track.length === 0) return null;
  if (track.length === 1) {
    return {
      point: track[0]!,
      segmentIndex: 0,
      distanceMeters: haversineMeters(pos, track[0]!),
    };
  }
  // Local equirectangular projection (accurate at campus scale).
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371000;
  const lat0 = toRad(pos.lat);
  const proj = (p: LatLng) => ({
    x: toRad(p.lng - pos.lng) * R * Math.cos(lat0),
    y: toRad(p.lat - pos.lat) * R,
  });
  let best: TrackSnap = {
    point: track[0]!,
    segmentIndex: 0,
    distanceMeters: Infinity,
  };
  for (let i = 0; i < track.length - 1; i++) {
    const a = proj(track[i]!);
    const b = proj(track[i + 1]!);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;
    const t = lenSq < 1e-12 ? 0 : Math.min(1, Math.max(0, (-(a.x * dx) - a.y * dy) / lenSq));
    const cx = a.x + t * dx;
    const cy = a.y + t * dy;
    const dist = Math.hypot(cx, cy);
    if (dist < best.distanceMeters) {
      // Back to lat/lng via inverse projection.
      const lng = pos.lng + (cx / (R * Math.cos(lat0))) * (180 / Math.PI);
      const lat = pos.lat + (cy / R) * (180 / Math.PI);
      best = { point: { lat, lng }, segmentIndex: i, distanceMeters: dist };
    }
  }
  return best;
}

/** True when the position is farther than thresholdMeters from the track. */
export function isOffTrack(pos: LatLng, track: LatLng[], thresholdMeters: number): boolean {
  const snap = snapToTrack(pos, track);
  if (!snap) return true;
  return snap.distanceMeters > thresholdMeters;
}

export type GeoRemaining = {
  remainingMeters: number;
  arrived: boolean;
  nextInstruction: string;
};

/**
 * Remaining walked meters from the snapped point to the track end.
 * Names the destination (junctions don't exist on raw tracks).
 */
export function remainingOnTrack(
  pos: LatLng,
  track: LatLng[],
  destinationName: string,
  arrivedWithinMeters = 10,
): GeoRemaining {
  const snap = snapToTrack(pos, track);
  if (!snap || track.length < 2) {
    return { remainingMeters: 0, arrived: true, nextInstruction: `You have arrived at ${destinationName}.` };
  }
  let remaining = haversineMeters(snap.point, track[snap.segmentIndex + 1]!);
  for (let i = snap.segmentIndex + 1; i < track.length - 1; i++) {
    remaining += haversineMeters(track[i]!, track[i + 1]!);
  }
  const arrived = remaining <= arrivedWithinMeters;
  return {
    remainingMeters: remaining,
    arrived,
    nextInstruction: arrived
      ? `You have arrived at ${destinationName}.`
      : `Continue towards ${destinationName}${remaining >= 20 ? ` for about ${Math.round(remaining)} m` : ''}.`,
  };
}
