// Pure origin-resolution rules for the destination-first flow.
// Kept free of React so the priority order is unit-testable:
// QR-confirmed > existing session > live snapped fix. GPS attempts and the
// demo fallback live in the page; the ordering rules live here.

export type FixSummary = {
  locationId: string | null;
  /** Only non-low-confidence fixes count as known. */
  confident: boolean;
};

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

/**
 * Demo fallback gate: MAIN_GATE may stand in as origin ONLY while the demo
 * dataset is active. Published datasets must show recovery UI instead —
 * never silently pretend a position.
 */
export function demoFallbackOrigin(isDemoDataset: boolean): string | null {
  return isDemoDataset ? 'MAIN_GATE' : null;
}
