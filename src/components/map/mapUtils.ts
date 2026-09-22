// Shared CRS.Simple helpers. Demo plane is 0–1000 on both axes.
// Leaflet LatLng is [lat, lng]; we render demo (x,y) as [1000 - y, x]
// so LIBRARY (y=180) appears at the top like the spec sketch.

export const CAMPUS_BOUNDS: [[number, number], [number, number]] = [
  [0, 0],
  [1000, 1000],
];

export function toLatLng(x = 0, y = 0): [number, number] {
  return [1000 - y, x];
}

/** Inverse: Leaflet click lat/lng → demo map coords. */
export function fromLatLng(lat: number, lng: number): { mapX: number; mapY: number } {
  return { mapX: lng, mapY: 1000 - lat };
}
