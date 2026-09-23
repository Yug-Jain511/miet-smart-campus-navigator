import { describe, expect, it } from 'vitest';
import { GpxParseError, parseGpx } from './gpxParser';

const TWO_POINTS = `<?xml version="1.0" encoding="UTF-8"?>
<gpx creator="StravaGPX" version="1.1" xmlns="http://www.topografix.com/GPX/1/1">
 <trk><name>Morning Walk</name><type>walking</type><trkseg>
  <trkpt lat="28.9722430" lon="77.6415160"><ele>227.4</ele><time>2026-09-23T04:55:13Z</time></trkpt>
  <trkpt lat="28.9724900" lon="77.6410590"><ele>227.4</ele><time>2026-09-23T04:56:45Z</time></trkpt>
 </trkseg></trk>
</gpx>`;

describe('GPX parser', () => {
  it('extracts track points with elevation + timestamps in order', () => {
    const track = parseGpx(TWO_POINTS, 'test.gpx');
    expect(track.points).toHaveLength(2);
    expect(track.points[0]).toMatchObject({ lat: 28.9722430, lng: 77.6415160 });
    expect(track.points[0]!.ele).toBeCloseTo(227.4);
    expect(track.points[0]!.time).toBe('2026-09-23T04:55:13Z');
    expect(track.source).toBe('test.gpx');
  });

  it('drops stationary jitter below the 2 m threshold', () => {
    const xml = `<?xml version="1.0"?><gpx version="1.1"><trk><trkseg>
      <trkpt lat="28.9720000" lon="77.6410000"></trkpt>
      <trkpt lat="28.9720000" lon="77.6410000"></trkpt>
      <trkpt lat="28.9720000" lon="77.6410050"></trkpt>
      <trkpt lat="28.9725000" lon="77.6415000"></trkpt>
    </trkseg></trk></gpx>`;
    const track = parseGpx(xml, 'jitter.gpx');
    expect(track.points).toHaveLength(2);
  });

  it('rejects malformed XML', () => {
    expect(() => parseGpx('not xml at all', 'bad.gpx')).toThrowError(GpxParseError);
    try {
      parseGpx('<html></html>', 'bad.gpx');
      expect.unreachable();
    } catch (e) {
      expect((e as GpxParseError).code).toBe('malformed-xml');
    }
  });

  it('rejects empty tracks and all-stationary tracks', () => {
    const empty = `<?xml version="1.0"?><gpx version="1.1"><trk><trkseg></trkseg></trk></gpx>`;
    expect(() => parseGpx(empty, 'empty.gpx')).toThrowError(/no track points/);
    const still = `<?xml version="1.0"?><gpx version="1.1"><trk><trkseg>
      <trkpt lat="28.9720000" lon="77.6410000"></trkpt>
      <trkpt lat="28.9720000" lon="77.6410000"></trkpt>
    </trkseg></trk></gpx>`;
    try {
      parseGpx(still, 'still.gpx');
      expect.unreachable();
    } catch (e) {
      expect((e as GpxParseError).code).toBe('single-point');
    }
  });
});
