import { useCallback, useEffect, useRef, useState } from 'react';
import type { NavigationGraph } from '../models/types';
import type { CalibrationPoint } from '../services/positioning/calibration';
import {
  clearGpsWatch,
  getGpsOnce,
  watchGps,
  type GpsReading,
} from '../services/positioning/gpsProvider';
import { manualFixForPoint } from '../services/positioning/manualProvider';
import { resolveGpsFix } from '../services/positioning/positionService';
import { qrFixForLocation } from '../services/positioning/qrProvider';
import {
  DEFAULT_MAX_SNAP_METERS,
  unknownFix,
  type PositionFix,
} from '../services/positioning/types';

/**
 * Owns the user-position state (C), separate from routing state.
 * GPS watch updates only this fix — the Leaflet marker reads it via props.
 */
export function usePosition(
  graph: NavigationGraph,
  calibrationPoints: CalibrationPoint[] = [],
) {
  const [fix, setFix] = useState<PositionFix>(() => unknownFix());
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [tracking, setTracking] = useState(false);
  const watchId = useRef<number | null>(null);

  const applyReading = useCallback(
    (reading: GpsReading) => {
      setFix(resolveGpsFix(reading, graph, calibrationPoints));
    },
    [graph, calibrationPoints],
  );

  const locateOnce = useCallback(async () => {
    setGpsError(null);
    try {
      const reading = await getGpsOnce();
      applyReading(reading);
    } catch (err) {
      setGpsError(err instanceof Error ? err.message : 'Unable to get GPS position.');
    }
  }, [applyReading]);

  const startTracking = useCallback(() => {
    setGpsError(null);
    const id = watchGps(applyReading, (msg) => {
      setGpsError(msg);
      setTracking(false);
    });
    if (id !== null) {
      watchId.current = id;
      setTracking(true);
    }
  }, [applyReading]);

  const stopTracking = useCallback(() => {
    clearGpsWatch(watchId.current);
    watchId.current = null;
    setTracking(false);
  }, []);

  useEffect(() => {
    return () => clearGpsWatch(watchId.current);
  }, []);

  const applyQr = useCallback((locationId: string) => {
    const f = qrFixForLocation(locationId);
    if (f) {
      setFix(f);
      setGpsError(null);
    }
    return f;
  }, []);

  const applyManual = useCallback(
    (mapX: number, mapY: number, maxSnap = DEFAULT_MAX_SNAP_METERS) => {
      const f = manualFixForPoint(mapX, mapY, graph, maxSnap);
      setFix(f);
      return f;
    },
    [graph],
  );

  const clear = useCallback(() => setFix(unknownFix()), []);

  return {
    fix,
    gpsError,
    tracking,
    locateOnce,
    startTracking,
    stopTracking,
    applyQr,
    applyManual,
    setFix,
    clear,
  };
}

export type PositionState = ReturnType<typeof usePosition>;
