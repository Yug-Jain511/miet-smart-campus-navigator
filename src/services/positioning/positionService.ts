// Position resolution: turns raw inputs into honest PositionFix values.
// GPS without calibration can NEVER resolve a node — it stays raw + low.
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

export type GpsResolutionOptions = {
  maxSnapMeters?: number;
  /** Poor-accuracy warning threshold (display only). */
  poorAccuracyMeters?: number;
};

export const DEFAULT_POOR_ACCURACY_METERS = 25;

export function resolveGpsFix(
  reading: GpsReading,
  graph: NavigationGraph,
  calibrationPoints: CalibrationPoint[],
  opts: GpsResolutionOptions = {},
): PositionFix {
  const maxSnap = opts.maxSnapMeters ?? DEFAULT_MAX_SNAP_METERS;
  const poorAt = opts.poorAccuracyMeters ?? DEFAULT_POOR_ACCURACY_METERS;
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
