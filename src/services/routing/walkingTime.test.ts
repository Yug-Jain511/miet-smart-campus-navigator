import { describe, expect, it } from 'vitest';
import { formatDistance, formatWalkingTime, walkingTimeSeconds } from './walkingTime';

describe('walking time + formatting', () => {
  it('computes time from the 1.4 m/s walking speed', () => {
    expect(walkingTimeSeconds(140)).toBeCloseTo(100);
    expect(walkingTimeSeconds(0)).toBe(0);
  });

  it('formats distances and ETAs for humans', () => {
    expect(formatDistance(180)).toBe('180 m');
    expect(formatDistance(1500)).toBe('1.5 km');
    expect(formatWalkingTime(0)).toBe('0 min');
    expect(formatWalkingTime(140)).toBe('2 min');
    expect(formatWalkingTime(20)).toBe('1 min'); // minimum 1 min for real walks
  });
});
