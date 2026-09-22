import { describe, expect, it } from 'vitest';
import { getBundledDataset } from './loader';
import type { CampusDataset } from './schema';
import { validateCampusDataset } from './validator';

function bundled(): CampusDataset {
  return getBundledDataset();
}

describe('campus dataset validation', () => {
  it('bundled demo dataset is valid', () => {
    const report = validateCampusDataset(bundled());
    expect(report.errors).toEqual([]);
    expect(report.valid).toBe(true);
    expect(report.counts).toMatchObject({ locations: 3, nodes: 3, edges: 3, qrCodes: 3 });
  });

  it('rejects duplicate ids', () => {
    const d = bundled();
    d.locations.push({ ...d.locations[0]! });
    const report = validateCampusDataset(d);
    expect(report.valid).toBe(false);
    expect(report.errors.some((e) => e.code === 'duplicate-locations-id')).toBe(true);
  });

  it('rejects edges referencing missing nodes', () => {
    const d = bundled();
    d.edges.push({
      id: 'EDGE_BAD',
      from: 'NODE_GATE',
      to: 'NODE_NOWHERE',
      distanceMeters: 10,
    });
    const report = validateCampusDataset(d);
    expect(report.valid).toBe(false);
    expect(report.errors.some((e) => e.code === 'broken-edge-ref')).toBe(true);
  });

  it('rejects non-positive distances', () => {
    const d = bundled();
    d.edges[0] = { ...d.edges[0]!, distanceMeters: -5 };
    const report = validateCampusDataset(d);
    expect(report.valid).toBe(false);
    expect(report.errors.some((e) => e.code === 'bad-distance')).toBe(true);
  });

  it('rejects invalid QR targets', () => {
    const d = bundled();
    d.qrCodes[0] = { ...d.qrCodes[0]!, locationId: 'NOWHERE' };
    const report = validateCampusDataset(d);
    expect(report.valid).toBe(false);
    expect(report.errors.some((e) => e.code === 'bad-qr-target')).toBe(true);
  });

  it('rejects disconnected graphs', () => {
    const d = bundled();
    for (const e of d.edges) e.blocked = true;
    const report = validateCampusDataset(d);
    expect(report.valid).toBe(false);
    expect(report.errors.some((e) => e.code === 'disconnected-graph')).toBe(true);
  });

  it('rejects wrong schema versions', () => {
    const report = validateCampusDataset({ ...bundled(), schemaVersion: 999 });
    expect(report.valid).toBe(false);
    expect(report.errors.some((e) => e.code === 'schema-version')).toBe(true);
  });

  it('warns on missing QR coverage and missing calibration', () => {
    const d = bundled();
    d.qrCodes = d.qrCodes.filter((q) => q.locationId !== 'LIBRARY');
    const report = validateCampusDataset(d);
    expect(report.valid).toBe(true);
    expect(report.warnings.some((w) => w.code === 'missing-qr')).toBe(true);
    expect(report.warnings.some((w) => w.code === 'no-calibration')).toBe(true);
  });
});
