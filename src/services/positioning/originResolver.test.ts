import { describe, expect, it } from 'vitest';
import { demoFallbackOrigin, pickKnownOrigin } from './originResolver';

describe('destination-first origin resolution', () => {
  it('prefers QR over session over live fix', () => {
    expect(
      pickKnownOrigin('MAIN_GATE', 'LIBRARY', { locationId: 'ADMIN_BLOCK', confident: true }),
    ).toBe('MAIN_GATE');
    expect(
      pickKnownOrigin(null, 'LIBRARY', { locationId: 'ADMIN_BLOCK', confident: true }),
    ).toBe('LIBRARY');
    expect(
      pickKnownOrigin(null, null, { locationId: 'ADMIN_BLOCK', confident: true }),
    ).toBe('ADMIN_BLOCK');
  });

  it('ignores low-confidence fixes', () => {
    expect(pickKnownOrigin(null, null, { locationId: 'ADMIN_BLOCK', confident: false })).toBeNull();
    expect(pickKnownOrigin(null, null, { locationId: null, confident: true })).toBeNull();
  });

  it('demo fallback yields MAIN_GATE only on the demo dataset', () => {
    expect(demoFallbackOrigin(true)).toBe('MAIN_GATE');
    expect(demoFallbackOrigin(false)).toBeNull();
  });
});
