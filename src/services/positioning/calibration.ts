// Geographic → campus-map calibration.
// Full affine (6-DOF) REQUIRES >= 3 non-collinear reference points.
// With exactly 2 points we fit only a similarity transform
// (translation + uniform scale + rotation) and say so explicitly.
// Anything less (or collinear points) is reported as insufficient —
// never a silent full-affine from 2 points.

export type CalibrationPoint = {
  lat: number;
  lng: number;
  mapX: number;
  mapY: number;
};

export type CalibrationStatus =
  | 'calibrated-affine'
  | 'calibrated-similarity'
  | 'insufficient';

export type SimilarityTransform = {
  kind: 'similarity';
  scale: number;
  cos: number;
  sin: number;
  tx: number;
  ty: number;
};

export type AffineTransform = {
  kind: 'affine';
  // mapX = ax*lat + bx*lng + cx ; mapY = ay*lat + by*lng + cy
  ax: number;
  bx: number;
  cx: number;
  ay: number;
  by: number;
  cy: number;
};

export type MapTransform = SimilarityTransform | AffineTransform;

export type CalibrationResult = {
  status: CalibrationStatus;
  transform: MapTransform | null;
  pointCount: number;
  note: string;
};

function validPoint(p: CalibrationPoint): boolean {
  return (
    Number.isFinite(p.lat) &&
    Number.isFinite(p.lng) &&
    Number.isFinite(p.mapX) &&
    Number.isFinite(p.mapY)
  );
}

/** Triangle area in geo space; ~0 means collinear (useless for affine). */
function triangleArea(
  a: CalibrationPoint,
  b: CalibrationPoint,
  c: CalibrationPoint,
): number {
  return Math.abs(
    (b.lng - a.lng) * (c.lat - a.lat) - (c.lng - a.lng) * (b.lat - a.lat),
  );
}

function findNonCollinearTriple(points: CalibrationPoint[]): number {
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      for (let k = j + 1; k < points.length; k++) {
        if (triangleArea(points[i]!, points[j]!, points[k]!) > 1e-12) return i;
      }
    }
  }
  return -1;
}

/** Solve a 3x3 linear system via Cramer-free Gaussian elimination. Returns null if singular. */
function solve3(m: number[][], v: number[]): [number, number, number] | null {
  const a = m.map((row, i) => [...row, v[i]!]);
  for (let col = 0; col < 3; col++) {
    let pivot = col;
    for (let row = col + 1; row < 3; row++) {
      if (Math.abs(a[row]![col]!) > Math.abs(a[pivot]![col]!)) pivot = row;
    }
    if (Math.abs(a[pivot]![col]!) < 1e-12) return null;
    [a[col], a[pivot]] = [a[pivot]!, a[col]!];
    const div = a[col]![col]!;
    for (let c = col; c < 4; c++) a[col]![c]! /= div;
    for (let row = 0; row < 3; row++) {
      if (row === col) continue;
      const factor = a[row]![col]!;
      for (let c = col; c < 4; c++) a[row]![c]! -= factor * a[col]![c]!;
    }
  }
  return [a[0]![3]!, a[1]![3]!, a[2]![3]!];
}

function fitAffine(
  a: CalibrationPoint,
  b: CalibrationPoint,
  c: CalibrationPoint,
): AffineTransform | null {
  // Use (lng, lat) as planar x/y — valid at campus scale; documented.
  const m = [
    [a.lng, a.lat, 1],
    [b.lng, b.lat, 1],
    [c.lng, c.lat, 1],
  ];
  const x = solve3(m, [a.mapX, b.mapX, c.mapX]);
  const y = solve3(m, [a.mapY, b.mapY, c.mapY]);
  if (!x || !y) return null;
  return { kind: 'affine', bx: x[0], ax: x[1], cx: x[2], by: y[0], ay: y[1], cy: y[2] };
}

function fitSimilarity(a: CalibrationPoint, b: CalibrationPoint): SimilarityTransform | null {
  const dxGeo = b.lng - a.lng;
  const dyGeo = b.lat - a.lat;
  const dxMap = b.mapX - a.mapX;
  const dyMap = b.mapY - a.mapY;
  const geoLen = Math.hypot(dxGeo, dyGeo);
  const mapLen = Math.hypot(dxMap, dyMap);
  if (geoLen < 1e-12 || mapLen < 1e-12) return null;
  const scale = mapLen / geoLen;
  const angleGeo = Math.atan2(dyGeo, dxGeo);
  const angleMap = Math.atan2(dyMap, dxMap);
  const theta = angleMap - angleGeo;
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  // t = P1 - s*R*p1  (p as lng/lat planar)
  const tx = a.mapX - scale * (cos * a.lng - sin * a.lat);
  const ty = a.mapY - scale * (sin * a.lng + cos * a.lat);
  return { kind: 'similarity', scale, cos, sin, tx, ty };
}

export function evaluateCalibration(points: CalibrationPoint[]): CalibrationResult {
  const valid = points.filter(validPoint);
  if (valid.length >= 3) {
    const idx = findNonCollinearTriple(valid);
    if (idx >= 0) {
      // First non-collinear triple (deterministic). Future: least-squares over all.
      let triple: [CalibrationPoint, CalibrationPoint, CalibrationPoint] | null = null;
      outer: for (let i = 0; i < valid.length && !triple; i++) {
        for (let j = i + 1; j < valid.length && !triple; j++) {
          for (let k = j + 1; k < valid.length && !triple; k++) {
            if (triangleArea(valid[i]!, valid[j]!, valid[k]!) > 1e-12) {
              triple = [valid[i]!, valid[j]!, valid[k]!];
              break outer;
            }
          }
        }
      }
      const t = triple ? fitAffine(triple[0], triple[1], triple[2]) : null;
      if (t) {
        return {
          status: 'calibrated-affine',
          transform: t,
          pointCount: valid.length,
          note: `Full affine transform from ${valid.length} reference points.`,
        };
      }
    }
    return {
      status: 'insufficient',
      transform: null,
      pointCount: valid.length,
      note: 'Reference points are collinear — affine calibration needs 3 non-collinear points.',
    };
  }
  if (valid.length === 2) {
    const t = fitSimilarity(valid[0]!, valid[1]!);
    if (t) {
      return {
        status: 'calibrated-similarity',
        transform: t,
        pointCount: 2,
        note: 'Similarity transform (translation + uniform scale + rotation) from 2 points. Add a third non-collinear point for full affine.',
      };
    }
  }
  return {
    status: 'insufficient',
    transform: null,
    pointCount: valid.length,
    note: 'Calibration insufficient: provide at least 2 points (similarity) or 3 non-collinear points (affine).',
  };
}

export function applyTransform(
  t: MapTransform,
  lat: number,
  lng: number,
): { mapX: number; mapY: number } {
  if (t.kind === 'similarity') {
    return {
      mapX: t.scale * (t.cos * lng - t.sin * lat) + t.tx,
      mapY: t.scale * (t.sin * lng + t.cos * lat) + t.ty,
    };
  }
  return {
    mapX: t.ax * lat + t.bx * lng + t.cx,
    mapY: t.ay * lat + t.by * lng + t.cy,
  };
}
