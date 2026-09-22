import { useMemo, useState } from 'react';
import type { NavigationGraph, RouteResult } from '../models/types';
import { findRoute } from '../services/routing/routeService';

/** Node id for a location, derived from the live graph (dataset-driven). */
function nodeIdForLocation(graph: NavigationGraph, locationId: string): string | undefined {
  return graph.nodes.find((n) => n.locationId === locationId)?.id;
}

/**
 * Holds the student journey state: current location → destination → route.
 * Pure routing call; Dijkstra lives in services/routing, not here.
 */
export function useRoute(graph: NavigationGraph) {
  const [currentLocationId, setCurrentLocationId] = useState<string | null>(null);
  const [destinationId, setDestinationId] = useState<string | null>(null);
  const [qrLocationId, setQrLocationId] = useState<string | null>(null);
  const [recent, setRecent] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('recent-destinations') ?? '[]');
    } catch {
      return [];
    }
  });
  const [formError, setFormError] = useState<string | null>(null);

  const route: RouteResult | null | undefined = useMemo(() => {
    if (!currentLocationId || !destinationId) return undefined; // not requested yet
    if (currentLocationId === destinationId) {
      const nodeId = nodeIdForLocation(graph, currentLocationId);
      if (!nodeId) return null;
      return findRoute(nodeId, nodeId, graph);
    }
    const from = nodeIdForLocation(graph, currentLocationId);
    const to = nodeIdForLocation(graph, destinationId);
    if (!from || !to) return null;
    return findRoute(from, to, graph);
  }, [currentLocationId, destinationId, graph]);

  function requestRoute(fromId: string | null, toId: string | null) {
    if (!toId) {
      setFormError('Please select a destination.');
      return;
    }
    if (fromId && fromId === toId) {
      setCurrentLocationId(fromId);
      setDestinationId(toId);
      setFormError('You are already at this location.');
      return;
    }
    setFormError(null);
    setCurrentLocationId(fromId);
    setDestinationId(toId);
    if (toId) {
      setRecent((prev) => {
        const next = [toId, ...prev.filter((id) => id !== toId)].slice(0, 5);
        try {
          localStorage.setItem('recent-destinations', JSON.stringify(next));
        } catch {
          /* private mode — ignore */
        }
        return next;
      });
    }
  }

  function applyQrLocation(locationId: string | null) {
    setQrLocationId(locationId);
    if (locationId) setCurrentLocationId(locationId);
  }

  return {
    currentLocationId,
    destinationId,
    qrLocationId,
    recent,
    route,
    formError,
    setCurrentLocationId,
    setDestinationId,
    requestRoute,
    applyQrLocation,
  };
}

export type RouteState = ReturnType<typeof useRoute>;
