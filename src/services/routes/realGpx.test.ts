// End-to-end guard over the REAL shipped GPX files (not fixtures).
// Proves: files exist at the served paths, parse clean, endpoints land
// near the verified anchors, and the concatenated Library route is sane.
// Vitest runs in node, so reading public/ from disk is legitimate here;
// the browser loads the same bytes via fetch('/routes/...').

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEMO_LOCATIONS } from '../../data/demoCampus/locations';
import { parseGpx } from './gpxParser';
import { concatTracks, trackLengthMeters } from './gpxGeometry';
import { gpxSourcesFor } from './routeRegistry';

const GATE_FILE = join(process.cwd(), 'public/routes/Main_gate_to_admin.gpx');
const LIB_FILE = join(process.cwd(), 'public/routes/Admin_block_to_library.gpx');

const byId = new Map(DEMO_LOCATIONS.map((l) => [l.id, l]));
const near = (lat: number, lng: number, id: string, maxM: number) => {
  const loc = byId.get(id)!;
  const dLat = (lat - loc.latitude!) * 111320;
  const dLng = (lng - loc.longitude!) * 111320 * Math.cos((lat * Math.PI) / 180);
  return Math.hypot(dLat, dLng) <= maxM;
};

describe('shipped GPX tracks', () => {
  it('Gate→Admin track runs gate to admin', () => {
    const track = parseGpx(readFileSync(GATE_FILE, 'utf8'), 'Main_gate_to_admin.gpx');
    expect(track.points.length).toBeGreaterThan(10);
    const first = track.points[0]!;
    const last = track.points[track.points.length - 1]!;
    expect(near(first.lat, first.lng, 'MAIN_GATE', 25)).toBe(true);
    expect(near(last.lat, last.lng, 'ADMIN_BLOCK', 25)).toBe(true);
    const len = trackLengthMeters(track.points);
    expect(len).toBeGreaterThan(40);
    expect(len).toBeLessThan(400);
  });

  it('Admin→Library track runs admin to library', () => {
    const track = parseGpx(readFileSync(LIB_FILE, 'utf8'), 'Admin_block_to_library.gpx');
    expect(track.points.length).toBeGreaterThan(10);
    const first = track.points[0]!;
    const last = track.points[track.points.length - 1]!;
    expect(near(first.lat, first.lng, 'ADMIN_BLOCK', 25)).toBe(true);
    expect(near(last.lat, last.lng, 'LIBRARY', 25)).toBe(true);
  });

  it('concatenated Library route is one continuous track', () => {
    const t1 = parseGpx(readFileSync(GATE_FILE, 'utf8'), 'a');
    const t2 = parseGpx(readFileSync(LIB_FILE, 'utf8'), 'b');
    const joined = concatTracks([t1.points, t2.points]);
    const l1 = trackLengthMeters(t1.points);
    const l2 = trackLengthMeters(t2.points);
    const lj = trackLengthMeters(joined);
    // Continuous: joined ≈ sum plus the short bridge across the ~6 m
    // junction gap between the two recordings.
    expect(lj).toBeGreaterThan(l1 + l2 - 30);
    expect(lj).toBeLessThan(l1 + l2 + 15);
    expect(joined.length).toBeGreaterThan(t1.points.length);
  });

  it('registry pairs match the shipped files', () => {
    expect(gpxSourcesFor('MAIN_GATE', 'ADMIN_BLOCK')).toEqual([
      '/routes/Main_gate_to_admin.gpx',
    ]);
    expect(gpxSourcesFor('MAIN_GATE', 'LIBRARY')).toEqual([
      '/routes/Main_gate_to_admin.gpx',
      '/routes/Admin_block_to_library.gpx',
    ]);
  });
});
