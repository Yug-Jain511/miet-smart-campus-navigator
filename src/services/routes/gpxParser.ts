// GPX track parsing. Source of truth: the .gpx files in public/routes/.
// Regex extraction (not DOMParser): vitest runs in a node environment and
// the app needs zero new dependencies. Strictly validates the fixed
// Strava-exported schema and reports typed, user-safe errors.

export type GpxPoint = {
  lat: number;
  lng: number;
  ele?: number;
  time?: string;
};

export type GpxTrack = {
  points: GpxPoint[];
  /** File the track was parsed from (for debugging/provenance). */
  source: string;
};

export type GpxParseErrorCode =
  | 'missing-file'
  | 'malformed-xml'
  | 'empty-track'
  | 'single-point';

export class GpxParseError extends Error {
  code: GpxParseErrorCode;
  constructor(code: GpxParseErrorCode, message: string) {
    super(message);
    this.name = 'GpxParseError';
    this.code = code;
  }
}

/** Consecutive points closer than this are stationary jitter, not walking. */
export const DEDUPE_METERS = 2;

function haversineMeters(latA: number, lngA: number, latB: number, lngB: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(latB - latA);
  const dLng = toRad(lngB - lngA);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(latA)) * Math.cos(toRad(latB)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Parse GPX XML text into a cleaned track. Throws GpxParseError. */
export function parseGpx(xml: string, source: string): GpxTrack {
  if (!xml || !xml.includes('<gpx') || !xml.includes('</gpx>')) {
    throw new GpxParseError('malformed-xml', `"${source}" is not a valid GPX document.`);
  }
  const ptRe = /<trkpt\s+lat="([^"]+)"\s+lon="([^"]+)"\s*>([\s\S]*?)<\/trkpt>/g;
  const raw: GpxPoint[] = [];
  let m: RegExpExecArray | null;
  while ((m = ptRe.exec(xml)) !== null) {
    const lat = Number(m[1]);
    const lng = Number(m[2]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const body = m[3] ?? '';
    const ele = /<ele>([^<]+)<\/ele>/.exec(body);
    const time = /<time>([^<]+)<\/time>/.exec(body);
    raw.push({
      lat,
      lng,
      ele: ele ? Number(ele[1]) : undefined,
      time: time ? time[1] : undefined,
    });
  }
  if (raw.length === 0) {
    throw new GpxParseError('empty-track', `"${source}" contains no track points.`);
  }
  // Drop stationary jitter (identical/consecutive points, e.g. standing still).
  const points = [raw[0]!];
  for (let i = 1; i < raw.length; i++) {
    const prev = points[points.length - 1]!;
    const cur = raw[i]!;
    if (haversineMeters(prev.lat, prev.lng, cur.lat, cur.lng) >= DEDUPE_METERS) {
      points.push(cur);
    }
  }
  if (points.length < 2) {
    throw new GpxParseError(
      'single-point',
      `"${source}" has no usable walking movement (all points stationary).`,
    );
  }
  return { points, source };
}

/** Fetch a GPX file and parse it. Maps HTTP failure to 'missing-file'. */
export async function fetchGpxTrack(url: string): Promise<GpxTrack> {
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new GpxParseError('missing-file', `Route file "${url}" could not be loaded. Check your connection.`);
  }
  if (!res.ok) {
    throw new GpxParseError(
      'missing-file',
      `Route file "${url}" is unavailable (HTTP ${res.status}).`,
    );
  }
  return parseGpx(await res.text(), url);
}
