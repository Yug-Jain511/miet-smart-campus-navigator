import { describe, expect, it } from 'vitest';
import { getDemoGraph } from '../../data/demoCampus';
import { DEMO_LOCATIONS, getLocationById } from '../../data/demoCampus/locations';
import { resolveGpsFix, type GpsAnchor } from './positionService';
import { applyTransform, evaluateCalibration } from './calibration';
import { findNearestSegment, snapToGraph } from './snap';

const GATE_ANCHOR: GpsAnchor = (() => {
  const loc = getLocationById('MAIN_GATE')!;
  return {
    locationId: loc.id,
    name: loc.name,
    nodeId: 'NODE_GATE',
    mapX: loc.mapX,
    mapY: loc.mapY,
    latitude: loc.latitude!,
    longitude: loc.longitude!,
  };
})();

/** All verified-gps anchors, mirroring the app's dataset-driven wiring. */
const ALL_ANCHORS: GpsAnchor[] = DEMO_LOCATIONS.filter(
  (l) => l.coordinateSource === 'verified-gps' && l.latitude !== undefined && l.longitude !== undefined,
).map((l) => ({
  locationId: l.id,
  name: l.name,
  mapX: l.mapX,
  mapY: l.mapY,
  latitude: l.latitude!,
  longitude: l.longitude!,
}));

describe('segment-first snapping with threshold gate', () => {
  it('snaps a point near the Gate walkway to the graph', () => {
    const graph = getDemoGraph();
    // (300,340) is ~75 map units (~36 m) from the J1–J2 walkway.
    const snap = snapToGraph(300, 340, graph, 100);
    expect(snap.snapped).toBe(true);
  });

  it('refuses to snap a far-away point (reports miss distance)', () => {
    const graph = getDemoGraph();
    // (300,600) is ~130 map units (~63 m) from the nearest path.
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
    // Invert: find a lat/lng that maps onto the GATE→J1 walkway.
    // Walkway midpoint ≈ (200, 485) in map coords.
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
    const near = inv(200, 485);
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

  it('GPS near the verified Main Gate coordinate anchors to MAIN_GATE', () => {
    const fix = resolveGpsFix(
      { latitude: 28.9723, longitude: 77.6419, accuracyMeters: 8 },
      getDemoGraph(),
      [],
      { anchors: [GATE_ANCHOR] },
    );
    expect(fix.source).toBe('gps');
    expect(fix.locationId).toBe('MAIN_GATE');
    expect(fix.nodeId).toBe('NODE_GATE');
    expect(fix.accuracyMeters).toBe(8); // real browser accuracy, never fabricated
    expect(fix.confidence).toBe('estimated');
    expect(fix.note).toMatch(/GPS location detected/);
  });

  it('GPS far from the gate stays raw — demo locations never GPS-resolve', () => {
    const fix = resolveGpsFix(
      { latitude: 28.98, longitude: 77.65, accuracyMeters: 8 },
      getDemoGraph(),
      [],
      { anchors: [GATE_ANCHOR] },
    );
    expect(fix.locationId).toBeUndefined();
    expect(fix.nodeId).toBeUndefined();
    expect(fix.confidence).toBe('low');
  });

  it('poor GPS accuracy at the gate keeps the anchor but flags low confidence', () => {
    const fix = resolveGpsFix(
      { latitude: 28.9723, longitude: 77.6419, accuracyMeters: 60 },
      getDemoGraph(),
      [],
      { anchors: [GATE_ANCHOR] },
    );
    expect(fix.locationId).toBe('MAIN_GATE');
    expect(fix.confidence).toBe('low');
  });

  it('all three verified anchors resolve — GPS near Library anchors LIBRARY', () => {
    expect(ALL_ANCHORS.map((a) => a.locationId).sort()).toEqual(
      ['ADMIN_BLOCK', 'LIBRARY', 'MAIN_GATE'],
    );
    const fix = resolveGpsFix(
      { latitude: 28.97295, longitude: 77.64081, accuracyMeters: 8 },
      getDemoGraph(),
      [],
      { anchors: ALL_ANCHORS, proximityMeters: 30 },
    );
    expect(fix.locationId).toBe('LIBRARY');
    expect(fix.confidence).toBe('estimated');
    expect(fix.note).toMatch(/GPS location detected/);
  });

  it('GPS near Admin Block anchors ADMIN_BLOCK (nearest wins over gate)', () => {
    const fix = resolveGpsFix(
      { latitude: 28.97258, longitude: 77.64114, accuracyMeters: 8 },
      getDemoGraph(),
      [],
      { anchors: ALL_ANCHORS, proximityMeters: 30 },
    );
    expect(fix.locationId).toBe('ADMIN_BLOCK');
    expect(fix.confidence).toBe('estimated');
  });

  it('a fix outside the 30 m anchor zones stays raw', () => {
    const fix = resolveGpsFix(
      { latitude: 28.9732, longitude: 77.6416, accuracyMeters: 8 },
      getDemoGraph(),
      [],
      { anchors: ALL_ANCHORS, proximityMeters: 30 },
    );
    expect(fix.locationId).toBeUndefined();
    expect(fix.confidence).toBe('low');
  });
});
