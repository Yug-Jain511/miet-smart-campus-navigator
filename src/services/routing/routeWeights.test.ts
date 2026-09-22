import { describe, expect, it } from 'vitest';
import { getDemoGraph } from '../../data/demoCampus';
import { findRoute } from './routeService';
import { computeEdgeWeight } from './routeWeights';

describe('route weights', () => {
  it('blocked edges are impassable', () => {
    expect(computeEdgeWeight({ id: 'x', from: 'a', to: 'b', distanceMeters: 10, blocked: true })).toBe(
      Infinity,
    );
  });

  it('default weights equal pure distance (MVP behavior unchanged)', () => {
    const graph = getDemoGraph();
    for (const e of graph.edges) {
      expect(computeEdgeWeight(e)).toBe(e.distanceMeters);
    }
  });

  it('accessibility penalty applies only to inaccessible edges', () => {
    const open = { id: 'a', from: 'x', to: 'y', distanceMeters: 100, accessible: true };
    const stepped = { id: 'b', from: 'x', to: 'y', distanceMeters: 100, accessible: false };
    expect(computeEdgeWeight(open, { accessibilityPenaltyMeters: 500 })).toBe(100);
    expect(computeEdgeWeight(stepped, { accessibilityPenaltyMeters: 500 })).toBe(600);
  });

  it('accessibility penalty can reroute around an inaccessible shortcut', () => {
    const graph = getDemoGraph();
    const direct = graph.edges.find((e) => e.id === 'EDGE_LIBRARY_ADMIN')!;
    direct.accessible = false;
    const penalized = findRoute('NODE_LIBRARY', 'NODE_ADMIN', graph, {
      accessibilityPenaltyMeters: 500,
    });
    // Direct 150+500=650 weighted vs via gate 180+220=400 → detour wins.
    expect(penalized!.nodeIds).toEqual(['NODE_LIBRARY', 'NODE_GATE', 'NODE_ADMIN']);
    // Displayed distance stays RAW meters (penalties select the path only).
    expect(penalized!.totalDistanceMeters).toBe(400);
    // Without penalty the direct edge still wins.
    const plain = findRoute('NODE_LIBRARY', 'NODE_ADMIN', getDemoGraph());
    expect(plain!.nodeIds).toEqual(['NODE_LIBRARY', 'NODE_ADMIN']);
  });
});
