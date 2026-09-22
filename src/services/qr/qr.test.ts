import { describe, expect, it } from 'vitest';
import { buildQrUrl, parseQrLocation, QR_LOCATION_PARAM } from './qrService';

describe('QR location handling', () => {
  it('parses valid location ids (case-insensitive, trimmed)', () => {
    expect(parseQrLocation('MAIN_GATE')).toBe('MAIN_GATE');
    expect(parseQrLocation('  library ')).toBe('LIBRARY');
    expect(parseQrLocation('admin_block')).toBe('ADMIN_BLOCK');
  });

  it('rejects unknown locations and empty input', () => {
    expect(parseQrLocation('CANTEEN')).toBeNull();
    expect(parseQrLocation('')).toBeNull();
    expect(parseQrLocation(null)).toBeNull();
  });

  it('validates against operator id lists', () => {
    expect(parseQrLocation('MAIN_GATE', ['MAIN_GATE'])).toBe('MAIN_GATE');
    expect(parseQrLocation('LIBRARY', ['MAIN_GATE'])).toBeNull();
  });

  it('builds QR urls with only a location id (no routing logic inside)', () => {
    const url = buildQrUrl('https://example.com/', 'MAIN_GATE');
    expect(url).toBe(`https://example.com/navigate?${QR_LOCATION_PARAM}=MAIN_GATE`);
  });
});
