// Data layer: campus dataset today (bundled campus.json or operator-published
// override), Firestore-ready tomorrow. All pages/hooks read through these
// functions so replacing the dataset updates map/graph/search/QR/navigation
// with NO React/TS source changes.

import type {
  CampusLocation,
  CampusQRCode,
  NavigationGraph,
} from '../../models/types';
import type { CalibrationPoint } from '../positioning/calibration';
import type { CampusDataset, CampusFeature, CampusSettings } from '../../data/campus/schema';
import {
  activeDatasetSource,
  clearPublishedDataset,
  getBundledDataset,
  loadActiveDataset,
  loadPublishedOverride,
  publishDataset,
} from '../../data/campus/loader';
import { resolveBaseUrl, buildQrUrl } from '../qr/qrService';

export type {
  CampusDataset,
  CampusFeature,
  CampusSettings,
  CalibrationPoint,
};
export { activeDatasetSource, clearPublishedDataset, publishDataset };

/** Full active dataset (bundled demo or published override). */
export function loadDataset(): CampusDataset {
  return loadActiveDataset();
}

export function loadLocations(): CampusLocation[] {
  return loadActiveDataset().locations.map((l) => ({ ...l }));
}

export function loadGraph(): NavigationGraph {
  const d = loadActiveDataset();
  return {
    nodes: d.nodes.map((n) => ({ ...n })),
    edges: d.edges.map((e) => ({ ...e })),
  };
}

/** QR configs with live URLs (stored in Firestore later). */
export function loadQrCodes(): CampusQRCode[] {
  const base = resolveBaseUrl();
  const d = loadActiveDataset();
  const names = new Map(d.locations.map((l) => [l.id, l.name]));
  return d.qrCodes.map((q) => ({
    id: q.id,
    locationId: q.locationId,
    label: q.label || `${names.get(q.locationId) ?? q.locationId} QR`,
    url: buildQrUrl(base, q.locationId),
    active: q.active,
  }));
}

export function loadFeatures(): CampusFeature[] {
  return loadActiveDataset().features.map((f) => ({
    ...f,
    points: f.points?.map((p) => ({ ...p })),
  }));
}

export function loadCalibration(): CalibrationPoint[] {
  return loadActiveDataset().calibration.points.map((p) => ({ ...p }));
}

export function loadSettings(): CampusSettings {
  return { ...loadActiveDataset().settings };
}

export function getCounts() {
  const d = loadActiveDataset();
  return {
    locations: d.locations.length,
    nodes: d.nodes.length,
    edges: d.edges.length,
    qrCodes: d.qrCodes.length,
  };
}

/** Demo/bundled dataset info for the DEMO badge + Admin. */
export function getDatasetInfo() {
  const d = loadActiveDataset();
  return {
    source: activeDatasetSource(),
    campusName: d.campus.name,
    version: d.version ?? 'demo-1',
    mapType: d.campus.map.type,
    isDemo: loadPublishedOverride() === null,
    bundled: getBundledDataset(),
  };
}
