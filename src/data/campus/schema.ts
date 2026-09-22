// Canonical campus dataset schema (v1).
// This is THE format data operators upload. Everything the app renders —
// map, locations, graph, search, QR targets, calibration — comes from here.
// No React/TS edits are needed to replace the campus dataset.

import type {
  CampusLocation,
  CampusQRCode,
  NavigationEdge,
  NavigationNode,
} from '../../models/types';
import type { CalibrationPoint } from '../../services/positioning/calibration';

export const CAMPUS_SCHEMA_VERSION = 1;

export type CampusMapDef = {
  /** 'plane' = demo CRS.Simple grid; 'image' = real campus map overlay. */
  type: 'plane' | 'image';
  image?: string;
  width: number;
  height: number;
};

export type CampusFeature = {
  id: string;
  kind: 'lawn' | 'building' | 'tree' | 'gate';
  label?: string;
  /** Polygon points (for lawn/building) in map coords. */
  points?: Array<{ x: number; y: number }>;
  /** Circle center (for tree/gate markers). */
  x?: number;
  y?: number;
  radius?: number;
  color?: string;
  fill?: string;
};

export type CampusMeta = {
  id: string;
  name: string;
  map: CampusMapDef;
};

export type CampusSettings = {
  maxSnapMeters: number;
  poorAccuracyMeters: number;
  offRouteMeters: number;
};

export type CampusDataset = {
  schemaVersion: number;
  campus: CampusMeta;
  locations: CampusLocation[];
  nodes: NavigationNode[];
  edges: NavigationEdge[];
  qrCodes: Array<Pick<CampusQRCode, 'id' | 'locationId' | 'label' | 'active'>>;
  features: CampusFeature[];
  calibration: { points: CalibrationPoint[] };
  settings: CampusSettings;
  /** Operator bookkeeping (optional in uploaded files). */
  version?: string;
  updatedAt?: string;
};
