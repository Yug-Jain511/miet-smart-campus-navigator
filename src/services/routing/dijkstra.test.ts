import { describe, expect, it } from 'vitest';
import { getDemoGraph } from '../../data/demoCampus';
import { findRoute } from './routeService';

// Demo pedestrian network (fictional distances):
// GATE→J1 90, J1→J2 110, J2→LIB 100  (= 300 Gate→Library)
// J1→J3 130, J3→ADMIN 120            (= 340 Gate→Admin)
// J2→J3 140 cross-link               (= 360 Library→Admin via J2–J3)

describe('routing engine (Dijkstra)', () => {
  it('Test 1: Main Gate → Library walks GATE→J1→J2→LIB (300 m)', () => {
    const route = findRoute('NODE_GATE', 'NODE_LIBRARY', getDemoGraph());
    expect(route).not.toBeNull();
    expect(route!.nodeIds).toEqual(['NODE_GATE', 'JUNCTION_01', 'JUNCTION_02', 'NODE_LIBRARY']);
    expect(route!.totalDistanceMeters).toBe(300);
  });

  it('Test 2: Main Gate → Admin Block walks GATE→J1→J3→ADMIN (340 m)', () => {
    const route = findRoute('NODE_GATE', 'NODE_ADMIN', getDemoGraph());
    expect(route).not.toBeNull();
    expect(route!.nodeIds).toEqual(['NODE_GATE', 'JUNCTION_01', 'JUNCTION_03', 'NODE_ADMIN']);
    expect(route!.totalDistanceMeters).toBe(340);
  });

  it('Test 3: Library → Admin Block walks LIB→J2→J3→ADMIN (360 m)', () => {
    const route = findRoute('NODE_LIBRARY', 'NODE_ADMIN', getDemoGraph());
    expect(route).not.toBeNull();
    expect(route!.nodeIds).toEqual(['NODE_LIBRARY', 'JUNCTION_02', 'JUNCTION_03', 'NODE_ADMIN']);
    expect(route!.totalDistanceMeters).toBe(360);
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

  it('Test 6: blocked cross-link reroutes via JUNCTION_01', () => {
    const graph = getDemoGraph();
    const edge = graph.edges.find((e) => e.id === 'EDGE_J2_J3');
    expect(edge).toBeDefined();
    edge!.blocked = true;

    const route = findRoute('NODE_LIBRARY', 'NODE_ADMIN', graph);
    expect(route).not.toBeNull();
    // LIB→J2 (100) + J2→J1 (110) + J1→J3 (130) + J3→ADMIN (120) = 460 m detour.
    expect(route!.nodeIds).toEqual([
      'NODE_LIBRARY',
      'JUNCTION_02',
      'JUNCTION_01',
      'JUNCTION_03',
      'NODE_ADMIN',
    ]);
    expect(route!.totalDistanceMeters).toBe(460);
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
