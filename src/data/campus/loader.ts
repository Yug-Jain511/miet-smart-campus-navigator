// Dataset loading + providers.
// DEFAULT: bundled campus.json (works offline, no Firebase).
// OPTIONAL: operator-published override from localStorage, Firestore later.
// A normal campus-data update NEVER touches React/TS source.

import bundledJson from './campus.json';
import { CAMPUS_SCHEMA_VERSION, type CampusDataset } from './schema';
import { validateCampusDataset } from './validator';

const OVERRIDE_KEY = 'miet-campus-dataset-v1';

function deepCopy<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

function bundledDataset(): CampusDataset {
  return deepCopy(bundledJson as unknown as CampusDataset);
}

/** Operator-published override, only when it validates. */
export function loadPublishedOverride(): CampusDataset | null {
  try {
    const raw = localStorage.getItem(OVERRIDE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    const report = validateCampusDataset(parsed);
    if (!report.valid) return null;
    return deepCopy(parsed as CampusDataset);
  } catch {
    return null;
  }
}

/** Active dataset: published override wins, bundled demo otherwise. */
export function loadActiveDataset(): CampusDataset {
  return loadPublishedOverride() ?? bundledDataset();
}

export function getBundledDataset(): CampusDataset {
  return bundledDataset();
}

/** Publish an operator dataset (must already validate). Replaces map/graph/search/QR at once. */
export function publishDataset(dataset: CampusDataset): void {
  const stamped: CampusDataset = {
    ...deepCopy(dataset),
    schemaVersion: CAMPUS_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(OVERRIDE_KEY, JSON.stringify(stamped));
}

export function clearPublishedDataset(): void {
  localStorage.removeItem(OVERRIDE_KEY);
}

export function activeDatasetSource(): 'published' | 'bundled-demo' {
  return loadPublishedOverride() ? 'published' : 'bundled-demo';
}

// --- Dataset accessors (single seam for the whole app) ---

export function nodeIdForLocationIn(dataset: CampusDataset, locationId: string): string | undefined {
  return dataset.nodes.find((n) => n.locationId === locationId)?.id;
}

export function locationNameIn(dataset: CampusDataset, locationId: string, fallback?: string): string {
  return (
    dataset.locations.find((l) => l.id === locationId)?.name ?? fallback ?? locationId
  );
}

/** nameOf resolver for directionService/routeService (dataset-driven). */
export function datasetNameResolver(dataset: CampusDataset): (locationId: string) => string {
  const names = new Map(dataset.locations.map((l) => [l.id, l.name]));
  const nodeLoc = new Map(dataset.nodes.map((n) => [n.id, n.locationId ?? n.label ?? n.id]));
  return (nodeOrLocationId: string) =>
    names.get(nodeOrLocationId) ??
    (nodeLoc.has(nodeOrLocationId)
      ? (names.get(nodeLoc.get(nodeOrLocationId)!) ?? nodeLoc.get(nodeOrLocationId)!)
      : nodeOrLocationId);
}
