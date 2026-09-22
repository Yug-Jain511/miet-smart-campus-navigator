import { describe, expect, it } from 'vitest';
import { getDemoGraph } from '../../data/demoCampus';
import { findRoute } from './routeService';

// Demo graph (fictional distances):
// GATE—LIBRARY 180m, GATE—ADMIN 220m, LIBRARY—ADMIN 150m.

describe('routing engine (Dijkstra)', () => {
  it('Test 1: Main Gate → Library uses the direct 180 m edge', () => {
    const route = findRoute('NODE_GATE', 'NODE_LIBRARY', getDemoGraph());
    expect(route).not.toBeNull();
    expect(route!.nodeIds).toEqual(['NODE_GATE', 'NODE_LIBRARY']);
    expect(route!.totalDistanceMeters).toBe(180);
  });

  it('Test 2: Main Gate → Admin Block uses the direct 220 m edge', () => {
    const route = findRoute('NODE_GATE', 'NODE_ADMIN', getDemoGraph());
    expect(route).not.toBeNull();
    expect(route!.nodeIds).toEqual(['NODE_GATE', 'NODE_ADMIN']);
    expect(route!.totalDistanceMeters).toBe(220);
  });

  it('Test 3: Library → Admin Block uses the direct 150 m edge', () => {
    const route = findRoute('NODE_LIBRARY', 'NODE_ADMIN', getDemoGraph());
    expect(route).not.toBeNull();
    expect(route!.nodeIds).toEqual(['NODE_LIBRARY', 'NODE_ADMIN']);
    expect(route!.totalDistanceMeters).toBe(150);
  });

  it('Test 4: same source and destination returns zero-distance route', () => {
    const route = findRoute('NODE_GATE', 'NODE_GATE', getDemoGraph());
    expect(route).not.toBeNull();
    expect(route!.totalDistanceMeters).toBe(0);
    expect(route!.nodeIds).toEqual(['NODE_GATE']);
  });

  it('Test 5: invalid node returns null', () => {
    expect(findRoute('NODE_GATE', 'NODE_NOWHERE', getDemoGraph())).toBeNull();
    expect(findRoute('NODE_NOWHERE', 'NODE_GATE', getDemoGraph())).toBeNull();
  });

  it('Test 6: blocked direct edge reroutes via alternate path', () => {
    const graph = getDemoGraph();
    const edge = graph.edges.find((e) => e.id === 'EDGE_LIBRARY_ADMIN');
    expect(edge).toBeDefined();
    edge!.blocked = true;

    const route = findRoute('NODE_LIBRARY', 'NODE_ADMIN', graph);
    expect(route).not.toBeNull();
    // LIB → GATE (180) + GATE → ADMIN (220) = 400 m detour.
    expect(route!.nodeIds).toEqual(['NODE_LIBRARY', 'NODE_GATE', 'NODE_ADMIN']);
    expect(route!.totalDistanceMeters).toBe(400);
  });

  it('no route available returns null when graph is disconnected', () => {
    const graph = getDemoGraph();
    for (const e of graph.edges) e.blocked = true;
    expect(findRoute('NODE_GATE', 'NODE_LIBRARY', graph)).toBeNull();
  });

  it('returns deterministic results for the same graph', () => {
    const a = findRoute('NODE_GATE', 'NODE_ADMIN', getDemoGraph());
    const b = findRoute('NODE_GATE', 'NODE_ADMIN', getDemoGraph());
    expect(a).toEqual(b);
  });
});
