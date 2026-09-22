// Dataset validation: bad data must never silently break the app.
// Only valid datasets can be published (errors block, warnings need confirm).

import { evaluateCalibration } from '../../services/positioning/calibration';
import { CAMPUS_SCHEMA_VERSION } from './schema';

export type ValidationIssue = {
  level: 'error' | 'warning';
  code: string;
  message: string;
};

export type ValidationReport = {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  counts: {
    locations: number;
    nodes: number;
    edges: number;
    qrCodes: number;
    calibrationPoints: number;
  };
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function asArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

/** Validate an unknown parsed value as a publishable campus dataset. */
export function validateCampusDataset(input: unknown): ValidationReport {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const err = (code: string, message: string) => errors.push({ level: 'error', code, message });
  const warn = (code: string, message: string) => warnings.push({ level: 'warning', code, message });

  if (!isRecord(input)) {
    err('not-object', 'Dataset must be a JSON object.');
    return report(input, errors, warnings);
  }
  const d = input as Record<string, unknown>;

  if (d.schemaVersion !== CAMPUS_SCHEMA_VERSION) {
    err(
      'schema-version',
      `Unsupported schemaVersion (got ${String(d.schemaVersion)}, need ${CAMPUS_SCHEMA_VERSION}).`,
    );
  }
  if (!isRecord(d.campus)) err('missing-campus', 'Missing "campus" object with id/name/map.');
  const map = isRecord(d.campus) ? (d.campus.map as unknown) : undefined;
  if (!isRecord(map)) {
    err('missing-map', 'Missing "campus.map" definition.');
  } else {
    if (map.type !== 'plane' && map.type !== 'image') {
      err('bad-map-type', 'campus.map.type must be "plane" or "image".');
    }
    if (map.type === 'image' && typeof map.image !== 'string') {
      err('missing-map-image', 'campus.map.image is required when type is "image".');
    }
    if (!(Number(map.width) > 0) || !(Number(map.height) > 0)) {
      err('bad-map-size', 'campus.map.width/height must be positive numbers.');
    }
  }

  const locations = asArray<Record<string, unknown>>(d.locations);
  const nodes = asArray<Record<string, unknown>>(d.nodes);
  const edges = asArray<Record<string, unknown>>(d.edges);
  const qrCodes = asArray<Record<string, unknown>>(d.qrCodes);

  // Duplicate IDs within each collection.
  for (const [name, arr, key] of [
    ['locations', locations, 'id'],
    ['nodes', nodes, 'id'],
    ['edges', edges, 'id'],
    ['qrCodes', qrCodes, 'id'],
  ] as const) {
    const seen = new Set<string>();
    for (const item of arr) {
      const id = typeof item[key] === 'string' ? (item[key] as string) : '';
      if (!id) {
        err(`missing-${name}-id`, `A ${name.replace(/s$/, '')} entry is missing its "${key}".`);
        continue;
      }
      if (seen.has(id)) err(`duplicate-${name}-id`, `Duplicate ${name.replace(/s$/, '')} id "${id}".`);
      seen.add(id);
    }
  }

  const locationIds = new Set(locations.map((l) => String(l.id)));
  const nodeIds = new Set(nodes.map((n) => String(n.id)));

  for (const l of locations) {
    if (l.mapX !== undefined && !(Number(l.mapX) >= 0)) {
      err('bad-coords', `Location "${String(l.id)}" has an invalid mapX.`);
    }
    if (l.mapY !== undefined && !(Number(l.mapY) >= 0)) {
      err('bad-coords', `Location "${String(l.id)}" has an invalid mapY.`);
    }
  }
  for (const n of nodes) {
    if (n.locationId !== undefined && n.locationId !== '' && !locationIds.has(String(n.locationId))) {
      warn('dangling-node-location', `Node "${String(n.id)}" points at unknown location "${String(n.locationId)}".`);
    }
  }
  for (const e of edges) {
    if (!nodeIds.has(String(e.from))) {
      err('broken-edge-ref', `Edge "${String(e.id)}" references missing node "${String(e.from)}".`);
    }
    if (!nodeIds.has(String(e.to))) {
      err('broken-edge-ref', `Edge "${String(e.id)}" references missing node "${String(e.to)}".`);
    }
    if (!(Number(e.distanceMeters) > 0)) {
      err('bad-distance', `Edge "${String(e.id)}" needs a positive distanceMeters.`);
    }
    if (Number(e.distanceMeters) < 0) {
      err('negative-distance', `Edge "${String(e.id)}" has a negative distance.`);
    }
  }
  for (const q of qrCodes) {
    if (!locationIds.has(String(q.locationId))) {
      err('bad-qr-target', `QR "${String(q.id)}" targets unknown location "${String(q.locationId)}".`);
    }
  }

  // Reachability: every location's node must be reachable from every other.
  if (nodeIds.size > 0 && errors.length === 0) {
    const adj = new Map<string, string[]>();
    for (const id of nodeIds) adj.set(id, []);
    for (const e of edges) {
      if ((e as { blocked?: boolean }).blocked) continue;
      const a = String(e.from);
      const b = String(e.to);
      if (adj.has(a) && adj.has(b)) {
        adj.get(a)!.push(b);
        adj.get(b)!.push(a);
      }
    }
    const locNodeIds = nodes
      .filter((n) => n.locationId && locationIds.has(String(n.locationId)))
      .map((n) => String(n.id));
    if (locNodeIds.length > 1) {
      const seen = new Set<string>([locNodeIds[0]!]);
      const queue = [locNodeIds[0]!];
      while (queue.length > 0) {
        const cur = queue.pop()!;
        for (const nb of adj.get(cur) ?? []) {
          if (!seen.has(nb)) {
            seen.add(nb);
            queue.push(nb);
          }
        }
      }
      const unreachable = locNodeIds.filter((id) => !seen.has(id));
      if (unreachable.length > 0) {
        err('disconnected-graph', `Locations unreachable from the graph: ${unreachable.join(', ')}.`);
      }
    }
  }

  // QR coverage + calibration advisories (warnings, not blockers).
  const qrTargets = new Set(qrCodes.filter((q) => q.active !== false).map((q) => String(q.locationId)));
  for (const l of locations) {
    if (!qrTargets.has(String(l.id))) {
      warn('missing-qr', `Location "${String(l.name ?? l.id)}" has no active QR point.`);
    }
  }
  const calPoints = isRecord(d.calibration) ? asArray(d.calibration.points) : [];
  const cal = evaluateCalibration(
    calPoints.filter(isRecord) as unknown as Parameters<typeof evaluateCalibration>[0],
  );
  if (cal.status === 'insufficient') {
    warn('no-calibration', 'No usable calibration points — GPS cannot resolve map positions yet.');
  } else if (cal.status === 'calibrated-similarity') {
    warn('similarity-only', 'Only 2 calibration points — similarity transform active; add a third non-collinear point for full affine.');
  }

  return report(input, errors, warnings);
}

function report(input: unknown, errors: ValidationIssue[], warnings: ValidationIssue[]): ValidationReport {
  const d = (isRecord(input) ? input : {}) as Record<string, unknown>;
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    counts: {
      locations: asArray(d.locations).length,
      nodes: asArray(d.nodes).length,
      edges: asArray(d.edges).length,
      qrCodes: asArray(d.qrCodes).length,
      calibrationPoints: isRecord(d.calibration) ? asArray(d.calibration.points).length : 0,
    },
  };
}
