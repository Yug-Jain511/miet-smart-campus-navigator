// Pure origin-resolution rules for the destination-first flow.
// Kept free of React so the priority order is unit-testable:
// QR-confirmed > existing session > live snapped fix > MAIN_GATE demo
// default (demo dataset only). NOTHING here touches the Geolocation API —
// browser GPS starts only from explicit user actions (Start Navigation,
// locate controls, Locate page).

export type FixSummary = {
  locationId: string | null;
  /** Only non-low-confidence fixes count as known. */
  confident: boolean;
};

export type PreviewOriginInput = {
  qrLocationId: string | null;
  sessionLocationId: string | null;
  fix: FixSummary;
  isDemoDataset: boolean;
};

export type PreviewOrigin =
  | { origin: string; isDemoFallback: false }
  | { origin: 'MAIN_GATE'; isDemoFallback: true }
  | { origin: null; isDemoFallback: false };

/**
 * Resolve the route-preview origin WITHOUT geolocation. For the MVP,
 * Main Gate is the default origin for every destination preview; real
 * positions (QR/session/confident fix) take priority when present.
 * Published datasets without any known origin yield null → recovery UI.
 */

/** First known origin, or null when automatic resolution must try GPS. */
export function pickKnownOrigin(
  qrLocationId: string | null,
  sessionLocationId: string | null,
  fix: FixSummary,
): string | null {
  if (qrLocationId) return qrLocationId;
  if (sessionLocationId) return sessionLocationId;
  if (fix.locationId && fix.confident) return fix.locationId;
  return null;
}

/** Preview origin with demo labeling. Never triggers geolocation. */
export function resolvePreviewOrigin(input: PreviewOriginInput): PreviewOrigin {
  const known = pickKnownOrigin(input.qrLocationId, input.sessionLocationId, input.fix);
  if (known) return { origin: known, isDemoFallback: false };
  const fallback = demoFallbackOrigin(input.isDemoDataset);
  if (fallback) return { origin: fallback, isDemoFallback: true };
  return { origin: null, isDemoFallback: false };
}

/**
 * Demo fallback gate: MAIN_GATE may stand in as origin ONLY while the demo
 * dataset is active. Published datasets must show recovery UI instead —
 * never silently pretend a position.
 */
export function demoFallbackOrigin(isDemoDataset: boolean): 'MAIN_GATE' | null {
  return isDemoDataset ? 'MAIN_GATE' : null;
}
