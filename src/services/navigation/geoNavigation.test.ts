import { describe, expect, it } from 'vitest';
import { isOffTrack, remainingOnTrack, snapToTrack } from './geoNavigation';

const GATE = { lat: 28.972317820229662, lng: 77.64158190939098 };
const ADMIN = { lat: 28.972574766129807, lng: 77.64114336820761 };
const TRACK = [GATE, { lat: 28.97245, lng: 77.64135 }, ADMIN];

describe('geo live navigation (real-track geometry)', () => {
  it('snaps an on-track position with ~0 distance', () => {
    const snap = snapToTrack({ lat: 28.97245, lng: 77.64135 }, TRACK)!;
    expect(snap.segmentIndex).toBe(0);
    expect(snap.distanceMeters).toBeLessThan(1);
  });

  it('detects off-track positions with real distance', () => {
    expect(isOffTrack(GATE, TRACK, 25)).toBe(false);
    expect(isOffTrack({ lat: 28.98, lng: 77.65 }, TRACK, 25)).toBe(true);
  });

  it('remaining shrinks to arrival at the destination', () => {
    const start = remainingOnTrack(GATE, TRACK, 'Admin Block');
    expect(start.remainingMeters).toBeGreaterThan(40);
    expect(start.arrived).toBe(false);
    expect(start.nextInstruction).toMatch(/Admin Block/);
    const end = remainingOnTrack(ADMIN, TRACK, 'Admin Block');
    expect(end.arrived).toBe(true);
    expect(end.nextInstruction).toMatch(/arrived/i);
  });

  it('handles degenerate tracks without crashing', () => {
    expect(snapToTrack(GATE, [])).toBeNull();
    expect(isOffTrack(GATE, [], 25)).toBe(true);
    expect(remainingOnTrack(GATE, [], 'X').arrived).toBe(true);
  });
});
