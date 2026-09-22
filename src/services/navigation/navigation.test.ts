import { describe, expect, it } from 'vitest';
import { getDemoGraph } from '../../data/demoCampus';
import { getLocationById } from '../../data/demoCampus/locations';
import { findRoute } from '../routing/routeService';
import {
  getNearestRoutePoint,
  isOffRoute,
  recalculateRoute,
  remainingRouteInfo,
  routePolyline,
} from './navigationService';

function names(graph: ReturnType<typeof getDemoGraph>) {
  const byId = new Map(graph.nodes.map((n) => [n.id, n.locationId ?? n.id]));
  return (nodeId: string) => {
    const loc = byId.get(nodeId) ?? nodeId;
    return getLocationById(loc)?.name ?? loc;
  };
}

describe('live navigation primitives', () => {
  it('routePolyline follows node order with real coordinates', () => {
    const graph = getDemoGraph();
    const route = findRoute('NODE_GATE', 'NODE_LIBRARY', graph)!;
    expect(routePolyline(route, graph)).toEqual([
      { x: 100, y: 500 },
      { x: 500, y: 180 },
    ]);
  });

  it('on-route positions are not off-route; far positions are', () => {
    const graph = getDemoGraph();
    const route = findRoute('NODE_GATE', 'NODE_LIBRARY', graph)!;
    expect(isOffRoute(300, 340, route, graph, 25)).toBe(false); // on segment
    expect(isOffRoute(300, 900, route, graph, 25)).toBe(true); // far away
  });

  it('remaining info shrinks toward the destination and ends in arrival', () => {
    const graph = getDemoGraph();
    const route = findRoute('NODE_GATE', 'NODE_LIBRARY', graph)!;
    const start = remainingRouteInfo(100, 500, route, graph, names(graph));
    // Gate→Library is 180 m; map-scale estimate should be close.
    expect(start.remainingMeters).toBeGreaterThan(100);
    expect(start.arrived).toBe(false);
    expect(start.nextInstruction).toMatch(/Library/);
    const end = remainingRouteInfo(500, 180, route, graph, names(graph));
    expect(end.arrived).toBe(true);
    expect(end.nextInstruction).toMatch(/arrived/i);
  });

  it('getNearestRoutePoint finds the closest segment', () => {
    const graph = getDemoGraph();
    const route = findRoute('NODE_GATE', 'NODE_LIBRARY', graph)!;
    const near = getNearestRoutePoint(300, 340, routePolyline(route, graph));
    expect(near.segmentIndex).toBe(0);
    expect(near.distanceMapUnits).toBeLessThan(1);
  });

  it('recalculate routes from a new position after a block', () => {
    const graph = getDemoGraph();
    graph.edges.find((e) => e.id === 'EDGE_LIBRARY_ADMIN')!.blocked = true;
    const next = recalculateRoute('NODE_LIBRARY', 'NODE_ADMIN', graph);
    expect(next!.nodeIds).toEqual(['NODE_LIBRARY', 'NODE_GATE', 'NODE_ADMIN']);
  });

  it('recalculate returns null when no path exists', () => {
    const graph = getDemoGraph();
    for (const e of graph.edges) e.blocked = true;
    expect(recalculateRoute('NODE_GATE', 'NODE_LIBRARY', graph)).toBeNull();
  });
});
