// QR helpers. QR codes store ONLY a location id — no routing logic.
// URL format: https://<domain>/navigate?location=MAIN_GATE

import { getLocationById } from '../../data/demoCampus/locations';

export const QR_LOCATION_PARAM = 'location';

export function buildQrUrl(baseUrl: string, locationId: string): string {
  const base = baseUrl.replace(/\/$/, '');
  return `${base}/navigate?${QR_LOCATION_PARAM}=${encodeURIComponent(locationId)}`;
}

export function resolveBaseUrl(): string {
  const env = (import.meta.env.VITE_APP_BASE_URL as string | undefined)?.trim();
  if (env) return env.replace(/\/$/, '');
  if (typeof window !== 'undefined') return window.location.origin;
  return 'https://miet-navigator-demo.vercel.app';
}

/** Returns the location id if valid, otherwise null (→ "invalid QR" message). */
export function parseQrLocation(raw: string | null, validIds?: string[]): string | null {
  if (!raw) return null;
  const id = raw.trim().toUpperCase();
  if (validIds) return validIds.includes(id) ? id : null;
  return getLocationById(id) ? id : null;
}
