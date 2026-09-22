// Position resolution: turns raw inputs into honest PositionFix values.
// GPS without calibration can NEVER resolve a node — it stays raw + low,
// EXCEPT proximity to a verified-gps anchor (today: MAIN_GATE only), which
// identifies the location without claiming any map transformation.
// GPS with calibration still passes the snap-threshold gate.

import type { NavigationGraph } from '../../models/types';
import {
  applyTransform,
  evaluateCalibration,
  type CalibrationPoint,
  type MapTransform,
} from './calibration';
import type { GpsReading } from './gpsProvider';
import { snapToGraph } from './snap';
import { DEFAULT_MAX_SNAP_METERS, type PositionFix } from './types';

export type GpsAnchor = {
  locationId: string;
  name: string;
  nodeId?: string;
  /** Demo map coords (fictional) for the marker — never derived from GPS. */
  mapX?: number;
  mapY?: number;
  /** Verified real-world coordinate. Only 'verified-gps' sources qualify. */
  latitude: number;
  longitude: number;
};

export type GpsResolutionOptions = {
  maxSnapMeters?: number;
  /** Poor-accuracy warning threshold (display only). */
  poorAccuracyMeters?: number;
  /** Haversine radius for verified-gps anchor matches. */
  proximityMeters?: number;
  /** Verified real-world anchors (empty = no GPS anchoring possible). */
  anchors?: GpsAnchor[];
};

export const DEFAULT_POOR_ACCURACY_METERS = 25;
export const DEFAULT_PROXIMITY_METERS = 50;

/** Great-circle distance in meters. */
export function haversineMeters(
  latA: number,
  lngA: number,
  latB: number,
  lngB: number,
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(latB - latA);
  const dLng = toRad(lngB - lngA);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(latA)) * Math.cos(toRad(latB)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function resolveGpsFix(
  reading: GpsReading,
  graph: NavigationGraph,
  calibrationPoints: CalibrationPoint[],
  opts: GpsResolutionOptions = {},
): PositionFix {
  const maxSnap = opts.maxSnapMeters ?? DEFAULT_MAX_SNAP_METERS;
  const poorAt = opts.poorAccuracyMeters ?? DEFAULT_POOR_ACCURACY_METERS;
  const proximity = opts.proximityMeters ?? DEFAULT_PROXIMITY_METERS;
  const poorAccuracy =
    reading.accuracyMeters !== undefined && reading.accuracyMeters > poorAt;

  // Verified-anchor proximity: identifies the LOCATION only. Map position
  // still comes from existing demo coords; accuracy is the real browser value.
  let nearest: { anchor: GpsAnchor; distance: number } | null = null;
  for (const anchor of opts.anchors ?? []) {
    const distance = haversineMeters(
      reading.latitude,
      reading.longitude,
      anchor.latitude,
      anchor.longitude,
    );
    if (!nearest || distance < nearest.distance) nearest = { anchor, distance };
  }
  if (nearest && nearest.distance <= proximity) {
    const { anchor, distance } = nearest;
    return {
      source: 'gps',
      confidence: poorAccuracy ? 'low' : 'estimated',
      locationId: anchor.locationId,
      nodeId: anchor.nodeId,
      latitude: reading.latitude,
      longitude: reading.longitude,
      mapX: anchor.mapX,
      mapY: anchor.mapY,
      accuracyMeters: reading.accuracyMeters,
      distanceToPathMeters: distance,
      note:
        `${anchor.name} — GPS location detected ` +
        `(${Math.round(distance)} m from the verified gate coordinate` +
        `${reading.accuracyMeters !== undefined ? `, accuracy ±${Math.round(reading.accuracyMeters)} m` : ''}).` +
        (poorAccuracy ? ' Accuracy is poor — verify before navigating.' : ''),
    };
  }

  const { status, transform } = evaluateCalibration(calibrationPoints);

  if (status === 'insufficient' || !transform) {
    return {
      source: 'gps',
      confidence: 'low',
      latitude: reading.latitude,
      longitude: reading.longitude,
      accuracyMeters: reading.accuracyMeters,
      note: 'GPS estimated, but campus calibration is pending — confirm with a QR code or set location manually.',
    };
  }
  return gpsToMapFix(reading, graph, transform, maxSnap, poorAt);
}

function gpsToMapFix(
  reading: GpsReading,
  graph: NavigationGraph,
  transform: MapTransform,
  maxSnap: number,
  poorAt: number,
): PositionFix {
  const { mapX, mapY } = applyTransform(transform, reading.latitude, reading.longitude);
  const snap = snapToGraph(mapX, mapY, graph, maxSnap);
  const poorAccuracy =
    reading.accuracyMeters !== undefined && reading.accuracyMeters > poorAt;

  if (snap.snapped) {
    return {
      source: 'gps',
      confidence: poorAccuracy ? 'low' : 'estimated',
      locationId: snap.locationId,
      nodeId: snap.nodeId,
      latitude: reading.latitude,
      longitude: reading.longitude,
      mapX: snap.nearestX,
      mapY: snap.nearestY,
      accuracyMeters: reading.accuracyMeters,
      distanceToPathMeters: snap.distanceMeters,
      note: poorAccuracy
        ? `GPS accuracy is poor (±${Math.round(reading.accuracyMeters!)} m). Snapped to nearest path — verify before navigating.`
        : `GPS estimated position (±${reading.accuracyMeters !== undefined ? Math.round(reading.accuracyMeters) + ' m' : 'unknown accuracy'}), snapped to nearest path.`,
    };
  }
  return {
    source: 'gps',
    confidence: 'low',
    latitude: reading.latitude,
    longitude: reading.longitude,
    mapX,
    mapY,
    accuracyMeters: reading.accuracyMeters,
    distanceToPathMeters: snap.distanceMeters ?? undefined,
    note: 'GPS puts you far from known campus paths. Confirm with a QR code or set location manually.',
  };
}
