import { describe, expect, it } from 'vitest';
import {
  applyTransform,
  evaluateCalibration,
  type CalibrationPoint,
} from './calibration';

const AFFINE_POINTS: CalibrationPoint[] = [
  { lat: 28.0, lng: 77.0, mapX: 100, mapY: 500 },
  { lat: 28.001, lng: 77.0, mapX: 500, mapY: 180 },
  { lat: 28.0, lng: 77.001, mapX: 880, mapY: 500 },
];

describe('calibration', () => {
  it('3 non-collinear points yield a full affine transform', () => {
    const r = evaluateCalibration(AFFINE_POINTS);
    expect(r.status).toBe('calibrated-affine');
    expect(r.transform?.kind).toBe('affine');
    // Round-trips the reference points.
    for (const p of AFFINE_POINTS) {
      const out = applyTransform(r.transform!, p.lat, p.lng);
      expect(out.mapX).toBeCloseTo(p.mapX, 6);
      expect(out.mapY).toBeCloseTo(p.mapY, 6);
    }
  });

  it('collinear points are insufficient for affine (never forced)', () => {
    const r = evaluateCalibration([
      { lat: 28.0, lng: 77.0, mapX: 0, mapY: 0 },
      { lat: 28.001, lng: 77.001, mapX: 100, mapY: 100 },
      { lat: 28.002, lng: 77.002, mapX: 200, mapY: 200 },
    ]);
    expect(r.status).toBe('insufficient');
    expect(r.transform).toBeNull();
  });

  it('2 points yield an explicit similarity transform, never affine', () => {
    const r = evaluateCalibration(AFFINE_POINTS.slice(0, 2));
    expect(r.status).toBe('calibrated-similarity');
    expect(r.transform?.kind).toBe('similarity');
    expect(r.note).toMatch(/similarity/i);
  });

  it('0–1 points are insufficient', () => {
    expect(evaluateCalibration([]).status).toBe('insufficient');
    expect(
      evaluateCalibration([{ lat: 28, lng: 77, mapX: 1, mapY: 2 }]).status,
    ).toBe('insufficient');
  });
});
