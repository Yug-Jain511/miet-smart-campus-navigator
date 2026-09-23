import { describe, expect, it } from 'vitest';
import { GPX_FILES, gpxSourcesFor, registeredGpxPairs } from './routeRegistry';

describe('GPX route registry', () => {
  it('uses the exact on-disk filenames', () => {
    expect(GPX_FILES.gateToAdmin).toBe('/routes/Main_gate_to_admin.gpx');
    expect(GPX_FILES.adminToLibrary).toBe('/routes/Admin_block_to_library.gpx');
  });

  it('resolves all three MVP pairs', () => {
    expect(gpxSourcesFor('MAIN_GATE', 'ADMIN_BLOCK')).toEqual([GPX_FILES.gateToAdmin]);
    expect(gpxSourcesFor('ADMIN_BLOCK', 'LIBRARY')).toEqual([GPX_FILES.adminToLibrary]);
    expect(gpxSourcesFor('MAIN_GATE', 'LIBRARY')).toEqual([
      GPX_FILES.gateToAdmin,
      GPX_FILES.adminToLibrary,
    ]);
  });

  it('returns null for unregistered pairs (demo-graph fallback)', () => {
    expect(gpxSourcesFor('LIBRARY', 'MAIN_GATE')).toBeNull();
    expect(gpxSourcesFor('MAIN_GATE', 'NOWHERE')).toBeNull();
  });

  it('lists every registered pair', () => {
    expect(registeredGpxPairs()).toHaveLength(3);
  });
});
