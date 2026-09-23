// Data-driven GPX route registry. Keys are "ORIGIN>DESTINATION" location ids;
// values are ordered GPX file URLs under public/routes/. Filenames below are
// the exact on-disk names (case-sensitive on hosting) — do not "fix" casing.
// Pairs without an entry fall back to the existing demo-graph flow.

export const GPX_BASE = '/routes';

export const GPX_FILES = {
  gateToAdmin: `${GPX_BASE}/Main_gate_to_admin.gpx`,
  adminToLibrary: `${GPX_BASE}/Admin_block_to_library.gpx`,
} as const;

const REGISTRY: Record<string, string[]> = {
  'MAIN_GATE>ADMIN_BLOCK': [GPX_FILES.gateToAdmin],
  'ADMIN_BLOCK>LIBRARY': [GPX_FILES.adminToLibrary],
  // Gate → Library walks the gate→admin track, then admin→library.
  'MAIN_GATE>LIBRARY': [GPX_FILES.gateToAdmin, GPX_FILES.adminToLibrary],
};

/** Ordered GPX URLs for an origin→destination pair, or null (no GPX route). */
export function gpxSourcesFor(originId: string, destinationId: string): string[] | null {
  return REGISTRY[`${originId}>${destinationId}`] ?? null;
}

/** All registered pairs (for Admin display + tests). */
export function registeredGpxPairs(): Array<{ origin: string; destination: string; files: string[] }> {
  return Object.entries(REGISTRY).map(([key, files]) => {
    const [origin, destination] = key.split('>');
    return { origin: origin!, destination: destination!, files };
  });
}
