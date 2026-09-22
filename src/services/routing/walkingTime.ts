// Single configurable walking speed for all ETA calculations.

export const DEFAULT_WALKING_SPEED_MPS = 1.4;

export function walkingTimeSeconds(distanceMeters: number): number {
  if (distanceMeters <= 0) return 0;
  return distanceMeters / DEFAULT_WALKING_SPEED_MPS;
}

/** Human-friendly distance: "180 m" or "1.2 km". */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/** Human-friendly ETA: "1 min", "4 min". Minimum 1 min for non-zero walks. */
export function formatWalkingTime(totalSeconds: number): string {
  if (totalSeconds <= 0) return '0 min';
  const minutes = Math.max(1, Math.round(totalSeconds / 60));
  return `${minutes} min`;
}
