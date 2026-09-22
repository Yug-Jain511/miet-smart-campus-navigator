// Positioning abstraction: A) destination data, B) routing data, C) user position
// are three separate concerns. This module owns (C) only.
// Sources: qr (confirmed) | gps (estimated) | manual (selected) | indoor (future) | unknown.

export type PositionSource = 'qr' | 'gps' | 'manual' | 'indoor' | 'unknown';

export type PositionConfidence = 'confirmed' | 'estimated' | 'low' | 'unknown';

export type PositionFix = {
  source: PositionSource;
  confidence: PositionConfidence;
  /** Resolved campus location id (only when snapped/confirmed). */
  locationId?: string;
  /** Resolved navigation node id (only when snapped/confirmed). */
  nodeId?: string;
  latitude?: number;
  longitude?: number;
  mapX?: number;
  mapY?: number;
  /** Real browser-reported GPS accuracy. Never fabricated. */
  accuracyMeters?: number;
  /** Distance from raw position to nearest path, when computed. */
  distanceToPathMeters?: number;
  note?: string;
};

/** Tunable gate: only snap when within this distance of a valid path. */
export const DEFAULT_MAX_SNAP_METERS = 25;

export function unknownFix(note = 'Location not determined yet.'): PositionFix {
  return { source: 'unknown', confidence: 'unknown', note };
}
