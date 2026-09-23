import { describe, expect, it } from 'vitest';
import { demoFallbackOrigin, pickKnownOrigin, resolvePreviewOrigin } from './originResolver';

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

  it('preview resolves real positions first, demo MAIN_GATE without GPS', () => {
    // QR-confirmed wins and is never labeled demo.
    expect(
      resolvePreviewOrigin({
        qrLocationId: 'LIBRARY',
        sessionLocationId: 'MAIN_GATE',
        fix: { locationId: 'ADMIN_BLOCK', confident: true },
        isDemoDataset: true,
      }),
    ).toEqual({ origin: 'LIBRARY', isDemoFallback: false });
    // Nothing known on demo data → MAIN_GATE default, honestly labeled.
    expect(
      resolvePreviewOrigin({
        qrLocationId: null,
        sessionLocationId: null,
        fix: { locationId: null, confident: false },
        isDemoDataset: true,
      }),
    ).toEqual({ origin: 'MAIN_GATE', isDemoFallback: true });
    // Nothing known on a published dataset → recovery UI, never a guess.
    expect(
      resolvePreviewOrigin({
        qrLocationId: null,
        sessionLocationId: null,
        fix: { locationId: null, confident: false },
        isDemoDataset: false,
      }),
    ).toEqual({ origin: null, isDemoFallback: false });
  });
});
