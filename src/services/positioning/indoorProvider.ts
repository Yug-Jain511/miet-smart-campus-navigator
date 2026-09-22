// Future indoor positioning (beacons / Wi-Fi). NOT implemented in MVP.
// Exists so routeService and UI never need rewrites when it arrives.

import type { PositionFix } from './types';

export function indoorFixUnavailable(): PositionFix {
  return {
    source: 'indoor',
    confidence: 'unknown',
    note: 'Indoor positioning is not available yet.',
  };
}
