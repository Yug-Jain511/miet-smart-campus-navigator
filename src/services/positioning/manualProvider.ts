// Manual positioning: user taps the map → snap to nearest valid path
// within the threshold. Far taps stay raw with low confidence.

import type { NavigationGraph } from '../../models/types';
import { haversineMeters, type GpsAnchor } from './positionService';
import { snapToGraph } from './snap';
import { DEFAULT_MAX_SNAP_METERS, type PositionFix } from './types';

export function manualFixForPoint(
  mapX: number,
  mapY: number,
  graph: NavigationGraph,
  maxSnapMeters: number = DEFAULT_MAX_SNAP_METERS,
): PositionFix {
  const snap = snapToGraph(mapX, mapY, graph, maxSnapMeters);
  if (snap.snapped) {
    return {
      source: 'manual',
      confidence: 'estimated',
      locationId: snap.locationId,
      nodeId: snap.nodeId,
      mapX: snap.nearestX,
      mapY: snap.nearestY,
      distanceToPathMeters: snap.distanceMeters,
      note: `Snapped to nearest path (about ${Math.round(snap.distanceMeters)} m away).`,
    };
  }
  return {
    source: 'manual',
    confidence: 'low',
    mapX,
    mapY,
    distanceToPathMeters: snap.distanceMeters ?? undefined,
    note: 'That point is far from known paths. Try a QR code or tap closer to a walkway.',
  };
}

/**
 * Manual fix on the GEOGRAPHIC map (real lat/lng tap). If the tap lands
 * within proximityMeters of a verified anchor it resolves to that place;
 * otherwise it stays a raw low-confidence fix (dot shown, no fake origin).
 * Never invents coordinates — the tap IS the position.
 */
export function manualFixForGeo(
  lat: number,
  lng: number,
  anchors: GpsAnchor[],
  proximityMeters: number,
): PositionFix {
  let nearest: { anchor: GpsAnchor; distance: number } | null = null;
  for (const anchor of anchors) {
    const distance = haversineMeters(lat, lng, anchor.latitude, anchor.longitude);
    if (!nearest || distance < nearest.distance) nearest = { anchor, distance };
  }
  if (nearest && nearest.distance <= proximityMeters) {
    return {
      source: 'manual',
      confidence: 'estimated',
      locationId: nearest.anchor.locationId,
      nodeId: nearest.anchor.nodeId,
      latitude: lat,
      longitude: lng,
      mapX: nearest.anchor.mapX,
      mapY: nearest.anchor.mapY,
      distanceToPathMeters: nearest.distance,
      note: `Manually set near ${nearest.anchor.name} (about ${Math.round(nearest.distance)} m away).`,
    };
  }
  return {
    source: 'manual',
    confidence: 'low',
    latitude: lat,
    longitude: lng,
    note: 'That point is far from known campus places. Try a QR code or tap closer to a marker.',
  };
}
