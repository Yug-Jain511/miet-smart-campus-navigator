import { describe, expect, it } from 'vitest';
import { getDemoGraph } from '../../data/demoCampus';
import { resolveGpsFix } from './positionService';
import { applyTransform, evaluateCalibration } from './calibration';
import { findNearestSegment, snapToGraph } from './snap';

describe('segment-first snapping with threshold gate', () => {
  it('snaps a point near the Gate–Library path to the graph', () => {
    const graph = getDemoGraph();
    const snap = snapToGraph(300, 340, graph, 100);
    expect(snap.snapped).toBe(true);
  });

  it('refuses to snap a far-away point (reports miss distance)', () => {
    const graph = getDemoGraph();
    // (300,600) is ~100 map units (~30 m) from the nearest path.
    const snap = snapToGraph(300, 600, graph, 1);
    expect(snap.snapped).toBe(false);
    if (!snap.snapped) expect(snap.distanceMeters).toBeGreaterThan(1);
  });

  it('ignores blocked edges as snap targets', () => {
    const graph = getDemoGraph();
    for (const e of graph.edges) e.blocked = true;
    expect(findNearestSegment(500, 400, graph)).toBeNull();
    expect(snapToGraph(500, 400, graph).snapped).toBe(false);
  });

  it('uncalibrated GPS never resolves a node (low confidence, raw)', () => {
    const fix = resolveGpsFix(
      { latitude: 28.67, longitude: 77.43, accuracyMeters: 8 },
      getDemoGraph(),
      [],
    );
    expect(fix.source).toBe('gps');
    expect(fix.nodeId).toBeUndefined();
    expect(fix.confidence).toBe('low');
    expect(fix.accuracyMeters).toBe(8);
  });

  it('calibrated GPS near a path snaps; far GPS stays raw with low confidence', () => {
    // Calibration mapping demo plane onto itself (identity-ish).
    const cal = evaluateCalibration([
      { lat: 0, lng: 0, mapX: 0, mapY: 1000 },
      { lat: 1000, lng: 0, mapX: 0, mapY: 0 },
      { lat: 0, lng: 1000, mapX: 1000, mapY: 1000 },
    ]);
    expect(cal.status).toBe('calibrated-affine');
    const t = cal.transform!;
    // Invert: find a lat/lng that maps near the Gate–Library segment.
    // Segment midpoint ≈ (300, 340) in map coords.
    const inv = (mapX: number, mapY: number) => {
      // Brute-force search over the identity-ish mapping for test purposes.
      for (let lat = 0; lat <= 1000; lat += 20) {
        for (let lng = 0; lng <= 1000; lng += 20) {
          const o = applyTransform(t, lat, lng);
          if (Math.hypot(o.mapX - mapX, o.mapY - mapY) < 15) return { lat, lng };
        }
      }
      throw new Error('no inverse found');
    };
    const near = inv(300, 340);
    const nearFix = resolveGpsFix(
      { latitude: near.lat, longitude: near.lng, accuracyMeters: 5 },
      getDemoGraph(),
      [
        { lat: 0, lng: 0, mapX: 0, mapY: 1000 },
        { lat: 1000, lng: 0, mapX: 0, mapY: 0 },
        { lat: 0, lng: 1000, mapX: 1000, mapY: 1000 },
      ],
    );
    expect(nearFix.nodeId).toBeDefined();

    const farFix = resolveGpsFix(
      { latitude: 5000, longitude: 5000, accuracyMeters: 5 },
      getDemoGraph(),
      [
        { lat: 0, lng: 0, mapX: 0, mapY: 1000 },
        { lat: 1000, lng: 0, mapX: 0, mapY: 0 },
        { lat: 0, lng: 1000, mapX: 1000, mapY: 1000 },
      ],
    );
    expect(farFix.nodeId).toBeUndefined();
    expect(farFix.confidence).toBe('low');
  });
});
