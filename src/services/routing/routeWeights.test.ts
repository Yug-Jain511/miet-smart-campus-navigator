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
    const cross = graph.edges.find((e) => e.id === 'EDGE_J2_J3')!;
    cross.accessible = false;
    const penalized = findRoute('NODE_LIBRARY', 'NODE_ADMIN', graph, {
      accessibilityPenaltyMeters: 500,
    });
    // Cross-link 140+500=640 weighted vs via J1 100+110+130+120=460 → detour wins.
    expect(penalized!.nodeIds).toEqual([
      'NODE_LIBRARY',
      'JUNCTION_02',
      'JUNCTION_01',
      'JUNCTION_03',
      'NODE_ADMIN',
    ]);
    // Displayed distance stays RAW meters (penalties select the path only).
    expect(penalized!.totalDistanceMeters).toBe(460);
    // Without penalty the cross-link still wins.
    const plain = findRoute('NODE_LIBRARY', 'NODE_ADMIN', getDemoGraph());
    expect(plain!.nodeIds).toEqual(['NODE_LIBRARY', 'JUNCTION_02', 'JUNCTION_03', 'NODE_ADMIN']);
  });
});
