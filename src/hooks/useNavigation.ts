import { useCallback, useMemo, useState } from 'react';
import type { NavigationGraph, RouteResult } from '../models/types';
import {
  isOffRoute,
  recalculateRoute,
  remainingRouteInfo,
  routePolyline,
  type RemainingInfo,
} from '../services/navigation/navigationService';
import type { PositionFix } from '../services/positioning/types';

export type NavMode = 'preview' | 'active';

/**
 * Live navigation session, separate from route preview.
 * Preview route comes from useRoute; start() copies it into a session that
 * tracks the live position fix (remaining, off-route) until stop().
 */
export function useNavigation(
  graph: NavigationGraph,
  offRouteMeters: number,
  vertexName: (nodeId: string) => string,
) {
  const [mode, setMode] = useState<NavMode>('preview');
  const [sessionRoute, setSessionRoute] = useState<RouteResult | null>(null);
  const [destNodeId, setDestNodeId] = useState<string | null>(null);
  const [offRoute, setOffRoute] = useState(false);
  const [info, setInfo] = useState<RemainingInfo | null>(null);

  const active = mode === 'active' && sessionRoute !== null;
  const polyline = useMemo(
    () => (sessionRoute ? routePolyline(sessionRoute, graph) : []),
    [sessionRoute, graph],
  );

  const start = useCallback((route: RouteResult) => {
    setSessionRoute(route);
    setDestNodeId(route.nodeIds[route.nodeIds.length - 1] ?? null);
    setOffRoute(false);
    setInfo(null);
    setMode('active');
  }, []);

  const stop = useCallback(() => {
    setMode('preview');
    setSessionRoute(null);
    setDestNodeId(null);
    setOffRoute(false);
    setInfo(null);
  }, []);

  /** Feed each live position fix; updates remaining + off-route only. */
  const updateFix = useCallback(
    (fix: PositionFix) => {
      if (!sessionRoute || fix.mapX === undefined || fix.mapY === undefined) return;
      const off = isOffRoute(fix.mapX, fix.mapY, sessionRoute, graph, offRouteMeters);
      setOffRoute(off);
      if (!off) {
        setInfo(remainingRouteInfo(fix.mapX, fix.mapY, sessionRoute, graph, vertexName));
      }
    },
    [sessionRoute, graph, offRouteMeters, vertexName],
  );

  /** Recalculate from the fix's snapped node (Recalculate button). */
  const recalculate = useCallback(
    (fix: PositionFix): RouteResult | null => {
      if (!destNodeId || !fix.nodeId) return null;
      const next = recalculateRoute(fix.nodeId, destNodeId, graph);
      if (next) {
        setSessionRoute(next);
        setOffRoute(false);
        setInfo(null);
      }
      return next;
    },
    [destNodeId, graph],
  );

  return { mode, active, sessionRoute, polyline, offRoute, info, start, stop, updateFix, recalculate };
}

export type NavigationState = ReturnType<typeof useNavigation>;
