// Current-location marker with honest source states.
// QR confirmed = solid pin. GPS = dot + REAL accuracy circle only
// (no fabricated ring). Manual = orange pin. Unknown = hidden.

import L from 'leaflet';
import { Circle, Marker, Tooltip } from 'react-leaflet';
import type { NavigationGraph } from '../../models/types';
import type { PositionFix } from '../../services/positioning/types';
import { computeMapScale } from '../../services/positioning/snap';
import { toLatLng } from './mapUtils';

function dotIcon(color: string, pulse: boolean): L.DivIcon {
  return L.divIcon({
    className: 'miet-marker',
    html: `<div style="position:relative;width:22px;height:22px;">
      ${pulse ? `<span style="position:absolute;inset:0;border-radius:9999px;background:${color};opacity:0.35;animation:miet-ping 1.8s ease-out infinite;"></span>` : ''}
      <span style="position:absolute;inset:3px;border-radius:9999px;background:${color};border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4);"></span>
    </div>
    <style>@keyframes miet-ping{0%{transform:scale(.6);opacity:.5}80%,100%{transform:scale(1.6);opacity:0}}</style>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

function pinIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: 'miet-marker',
    html: `<div style="width:30px;height:30px;border-radius:9999px 9999px 9999px 4px;transform:rotate(-45deg);background:${color};border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4);"></div>`,
    iconSize: [30, 30],
    iconAnchor: [8, 26],
  });
}

export function CurrentLocationMarker({
  fix,
  graph,
}: {
  fix: PositionFix;
  graph: NavigationGraph;
}) {
  if (fix.source === 'unknown' || fix.mapX === undefined || fix.mapY === undefined) {
    return null;
  }
  const pos = toLatLng(fix.mapX, fix.mapY);

  if (fix.source === 'gps') {
    const low = fix.confidence === 'low';
    const color = low ? '#5B5E66' : '#1668dc';
    const hasAccuracy =
      fix.accuracyMeters !== undefined && Number.isFinite(fix.accuracyMeters);
    // Convert real meters → map units via the graph's own scale. No guessing.
    const radiusUnits = hasAccuracy
      ? fix.accuracyMeters! / computeMapScale(graph)
      : 0;
    const label = hasAccuracy
      ? `Your GPS position (±${Math.round(fix.accuracyMeters!)} m)${low ? ' — low confidence' : ''}`
      : 'Your GPS position (accuracy unknown)';
    return (
      <>
        {hasAccuracy && radiusUnits > 0 ? (
          <Circle
            center={pos}
            radius={radiusUnits}
            pathOptions={{ color, weight: 1, fillColor: color, fillOpacity: 0.15 }}
            interactive={false}
          />
        ) : null}
        <Marker position={pos} icon={dotIcon(color, !low)} alt="Your location">
          <Tooltip direction="top" offset={[0, -12]} opacity={1}>
            {label}
          </Tooltip>
        </Marker>
      </>
    );
  }

  if (fix.source === 'manual') {
    return (
      <Marker position={pos} icon={pinIcon('#35363B')} alt="Manually selected location">
        <Tooltip direction="top" offset={[0, -28]} opacity={1}>
          Manually selected position
        </Tooltip>
      </Marker>
    );
  }

  // qr confirmed (+ indoor future): solid charcoal pin (banner carries the green confirm).
  return (
    <Marker position={pos} icon={pinIcon('#35363B')} alt="Confirmed location">
      <Tooltip direction="top" offset={[0, -28]} opacity={1}>
        You are here · QR confirmed
      </Tooltip>
    </Marker>
  );
}
