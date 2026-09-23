import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchGpxTrack, GpxParseError } from '../services/routes/gpxParser';
import {
  concatTracks,
  simplifyTrack,
  stepsFromWaypoints,
  trackLengthMeters,
  type LatLng,
  type TurnStep,
} from '../services/routes/gpxGeometry';
import { gpxSourcesFor } from '../services/routes/routeRegistry';
import { walkingTimeSeconds } from '../services/routing/walkingTime';

export type GpxRouteStatus = 'idle' | 'loading' | 'ready' | 'error';

export type GpxRoute = {
  /** Full cleaned track in walking order. */
  points: LatLng[];
  /** Simplified waypoints for rendering efficiency + turn steps. */
  waypoints: LatLng[];
  distanceMeters: number;
  etaSeconds: number;
  steps: TurnStep[];
  sources: string[];
};

/**
 * Loads the registered GPX route for origin→destination.
 * Distance/ETA come from real track geometry; nothing is hardcoded.
 */
export function useGpxRoute(
  originId: string | null,
  destinationId: string | null,
  originName: string,
  destinationName: string,
) {
  const [status, setStatus] = useState<GpxRouteStatus>('idle');
  const [route, setRoute] = useState<GpxRoute | null>(null);
  const [error, setError] = useState<string | null>(null);
  const activeKey = useRef<string | null>(null);

  const load = useCallback(async () => {
    if (!originId || !destinationId) {
      setStatus('idle');
      setRoute(null);
      setError(null);
      return;
    }
    const sources = gpxSourcesFor(originId, destinationId);
    if (!sources) {
      setStatus('idle'); // no GPX route — caller falls back to demo graph
      setRoute(null);
      setError(null);
      return;
    }
    const key = `${originId}>${destinationId}`;
    activeKey.current = key;
    setStatus('loading');
    setError(null);
    try {
      const tracks = await Promise.all(sources.map((url) => fetchGpxTrack(url)));
      if (activeKey.current !== key) return; // superseded
      const points = concatTracks(tracks.map((t) => t.points));
      const waypoints = simplifyTrack(points, 10);
      const distanceMeters = trackLengthMeters(points);
      setRoute({
        points,
        waypoints,
        distanceMeters,
        etaSeconds: walkingTimeSeconds(distanceMeters),
        steps: stepsFromWaypoints(
          waypoints.length > 0 ? waypoints : points,
          destinationName,
          originName,
        ),
        sources,
      });
      setStatus('ready');
    } catch (e) {
      if (activeKey.current !== key) return;
      const message =
        e instanceof GpxParseError
          ? e.message
          : 'The walking route could not be loaded. Check your connection and try again.';
      setError(message);
      setRoute(null);
      setStatus('error');
    }
  }, [originId, destinationId, originName, destinationName]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originId, destinationId]);

  return { status, route, error, reload: load };
}
