import { describe, expect, it } from 'vitest';
import { getDemoGraph } from '../../data/demoCampus';
import { findRoute } from '../../services/routing/routeService';
import { CAMPUS_BOUNDS, fromLatLng, routeToLatLngs, toLatLng } from './mapUtils';

describe('CRS.Simple coordinate convention', () => {
  it('toLatLng maps demo (x,y) to Leaflet [lat,lng] with flipped Y', () => {
    // LIBRARY (500,180) renders near the top of the 0–1000 plane.
    expect(toLatLng(500, 180)).toEqual([820, 500]);
    expect(toLatLng(100, 500)).toEqual([500, 100]);
  });

  it('fromLatLng inverts toLatLng exactly', () => {
    expect(fromLatLng(820, 500)).toEqual({ mapX: 500, mapY: 180 });
    expect(fromLatLng(500, 100)).toEqual({ mapX: 100, mapY: 500 });
  });

  it('all converted coords stay inside campus bounds', () => {
    const [[minLat, minLng], [maxLat, maxLng]] = CAMPUS_BOUNDS;
    for (const n of getDemoGraph().nodes) {
      const [lat, lng] = toLatLng(n.x, n.y);
      expect(lat).toBeGreaterThanOrEqual(minLat);
      expect(lat).toBeLessThanOrEqual(maxLat);
      expect(lng).toBeGreaterThanOrEqual(minLng);
      expect(lng).toBeLessThanOrEqual(maxLng);
    }
  });
});

describe('route polyline coordinates', () => {
  it('Gate→Library polyline follows the junction corridor in order', () => {
    const graph = getDemoGraph();
    const route = findRoute('NODE_GATE', 'NODE_LIBRARY', graph)!;
    expect(routeToLatLngs(route.nodeIds, graph.nodes)).toEqual([
      [500, 100], // NODE_GATE (100,500)
      [530, 300], // JUNCTION_01 (300,470)
      [700, 420], // JUNCTION_02 (420,300)
      [820, 500], // NODE_LIBRARY (500,180)
    ]);
  });

  it('every demo pair yields ≥2 valid polyline points', () => {
    const graph = getDemoGraph();
    const pairs: Array<[string, string]> = [
      ['NODE_GATE', 'NODE_LIBRARY'],
      ['NODE_GATE', 'NODE_ADMIN'],
      ['NODE_LIBRARY', 'NODE_ADMIN'],
    ];
    for (const [from, to] of pairs) {
      const route = findRoute(from, to, graph)!;
      const pts = routeToLatLngs(route.nodeIds, graph.nodes);
      expect(pts.length).toBeGreaterThanOrEqual(2);
      for (const [lat, lng] of pts) {
        expect(Number.isFinite(lat)).toBe(true);
        expect(Number.isFinite(lng)).toBe(true);
      }
    }
  });
});
