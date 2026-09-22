import { useCallback, useMemo, useState } from 'react';
import type { NavigationEdge, NavigationNode } from '../models/types';
import {
  getDatasetInfo,
  loadCalibration,
  loadFeatures,
  loadGraph,
  loadLocations,
  loadQrCodes,
  loadSettings,
} from '../services/firebase/campusStore';

/**
 * Campus data hook. Dataset-backed (bundled campus.json or published
 * override) — loads synchronously so the app never waits on Firebase.
 * Admin demo edits (edge distance / blocked) live here for the session.
 */
export function useCampusData() {
  const [locations] = useState(loadLocations);
  const [graph, setGraph] = useState(loadGraph);
  const [qrCodes] = useState(loadQrCodes);
  const [features] = useState(loadFeatures);
  const [calibration] = useState(loadCalibration);
  const [settings] = useState(loadSettings);
  const [datasetInfo] = useState(getDatasetInfo);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  const counts = useMemo(
    () => ({
      locations: locations.length,
      nodes: graph.nodes.length,
      edges: graph.edges.length,
      qrCodes: qrCodes.length,
    }),
    [locations, graph, qrCodes],
  );

  function updateEdgeDistance(edgeId: string, distanceMeters: number) {
    setGraph((g) => ({
      ...g,
      edges: g.edges.map((e) =>
        e.id === edgeId ? { ...e, distanceMeters: Math.max(1, distanceMeters) } : e,
      ),
    }));
  }

  function toggleEdgeBlocked(edgeId: string) {
    setGraph((g) => ({
      ...g,
      edges: g.edges.map((e) =>
        e.id === edgeId ? { ...e, blocked: !e.blocked } : e,
      ),
    }));
  }

  function resetGraph() {
    setGraph(loadGraph());
  }

  /** Map-editor foundation: place a node (session-only preview). */
  function addNode(node: NavigationNode) {
    setGraph((g) =>
      g.nodes.some((n) => n.id === node.id) ? g : { ...g, nodes: [...g.nodes, node] },
    );
  }

  /** Map-editor foundation: connect two nodes (session-only preview). */
  function addEdge(edge: NavigationEdge) {
    setGraph((g) =>
      g.edges.some((e) => e.id === edge.id) ? g : { ...g, edges: [...g.edges, edge] },
    );
  }

  /** Re-read the active dataset (call after Admin publish). */
  const refresh = useCallback(() => {
    setGraph(loadGraph());
  }, []);

  return {
    locations,
    graph,
    qrCodes,
    features,
    calibration,
    settings,
    datasetInfo,
    counts,
    loading,
    error,
    updateEdgeDistance,
    toggleEdgeBlocked,
    resetGraph,
    addNode,
    addEdge,
    refresh,
  };
}

export type CampusData = ReturnType<typeof useCampusData>;
