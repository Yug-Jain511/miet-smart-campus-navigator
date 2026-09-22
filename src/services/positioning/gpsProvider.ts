// Browser GPS wrapper. Reports raw coordinates + REAL accuracy only.
// Snapping/threshold decisions live in positionService, not here.

export type GpsReading = {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
};

export function isGeolocationAvailable(): boolean {
  return typeof navigator !== 'undefined' && 'geolocation' in navigator;
}

function toReading(pos: GeolocationPosition): GpsReading {
  return {
    latitude: pos.coords.latitude,
    longitude: pos.coords.longitude,
    accuracyMeters: Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : undefined,
  };
}

export function getGpsOnce(timeoutMs = 10000): Promise<GpsReading> {
  return new Promise((resolve, reject) => {
    if (!isGeolocationAvailable()) {
      reject(new Error('Geolocation is not available in this browser.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(toReading(pos)),
      (err) => reject(new Error(err.message || 'Unable to get GPS position.')),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 30000 },
    );
  });
}

/** Returns a watcher id; call clearGpsWatch(id) to stop. */
export function watchGps(
  onUpdate: (reading: GpsReading) => void,
  onError: (message: string) => void,
): number | null {
  if (!isGeolocationAvailable()) {
    onError('Geolocation is not available in this browser.');
    return null;
  }
  return navigator.geolocation.watchPosition(
    (pos) => onUpdate(toReading(pos)),
    (err) => onError(err.message || 'GPS tracking failed.'),
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
  );
}

export function clearGpsWatch(id: number | null): void {
  if (id !== null && isGeolocationAvailable()) {
    navigator.geolocation.clearWatch(id);
  }
}
