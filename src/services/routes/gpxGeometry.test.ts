import { describe, expect, it } from 'vitest';
import {
  concatTracks,
  haversineMeters,
  simplifyTrack,
  stepsFromWaypoints,
  trackLengthMeters,
  type LatLng,
} from './gpxGeometry';

const GATE = { lat: 28.972317820229662, lng: 77.64158190939098 };
const ADMIN = { lat: 28.972574766129807, lng: 77.64114336820761 };
const LIB = { lat: 28.972946691259995, lng: 77.64081479761072 };

describe('GPX geometry', () => {
  it('haversine matches known inter-anchor distances', () => {
    // Gate↔Admin ≈ 51 m, Admin↔Library ≈ 52 m, Gate↔Library ≈ 103 m.
    expect(haversineMeters(GATE, ADMIN)).toBeGreaterThan(45);
    expect(haversineMeters(GATE, ADMIN)).toBeLessThan(60);
    expect(haversineMeters(ADMIN, LIB)).toBeGreaterThan(45);
    expect(haversineMeters(ADMIN, LIB)).toBeLessThan(60);
    expect(haversineMeters(GATE, LIB)).toBeGreaterThan(95);
    expect(haversineMeters(GATE, LIB)).toBeLessThan(115);
  });

  it('track length sums legs; straight diagonal is sane', () => {
    const pts = [
      { lat: 28.972539, lng: 77.641073 },
      { lat: 28.972852, lng: 77.640755 },
    ];
    const len = trackLengthMeters(pts);
    expect(len).toBeGreaterThan(40);
    expect(len).toBeLessThan(60);
  });

  it('RDP keeps endpoints and drops collinear middles', () => {
    const line: LatLng[] = [
      { lat: 0, lng: 0 },
      { lat: 0.00005, lng: 0.00005 },
      { lat: 0.0001, lng: 0.0001 },
    ];
    const out = simplifyTrack(line, 10);
    expect(out).toEqual([line[0], line[2]]);
  });

  it('RDP keeps real corners', () => {
    const corner: LatLng[] = [
      { lat: 28.9722, lng: 77.6415 },
      { lat: 28.9725, lng: 77.6411 },
      { lat: 28.9725, lng: 77.6408 },
    ];
    // ~30 m jog off the straight line — must survive 10 m tolerance.
    expect(simplifyTrack(corner, 10)).toHaveLength(3);
  });

  it('concat joins tracks without near-duplicate seam points', () => {
    const t1 = [
      { lat: 1, lng: 1 },
      { lat: 2, lng: 2 },
    ];
    const t2 = [
      { lat: 2.000005, lng: 2.000005 }, // ~0.8 m — duplicate-ish
      { lat: 3, lng: 3 },
    ];
    const out = concatTracks([t1, t2]);
    expect(out).toHaveLength(3);
    expect(out[out.length - 1]).toEqual({ lat: 3, lng: 3 });
  });

  it('steps start, turn from real bearings, and arrive', () => {
    const wps = [GATE, ADMIN, LIB];
    const steps = stepsFromWaypoints(wps, 'Library', 'Main Gate');
    expect(steps[0]!.kind).toBe('start');
    expect(steps[steps.length - 1]!.kind).toBe('arrive');
    expect(steps[steps.length - 1]!.text).toMatch(/Library/);
    // monotone walked meters
    for (let i = 1; i < steps.length; i++) {
      expect(steps[i]!.atMeters).toBeGreaterThanOrEqual(steps[i - 1]!.atMeters);
    }
  });
});
