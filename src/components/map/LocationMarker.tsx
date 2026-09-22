import L from 'leaflet';
import { Marker, Tooltip } from 'react-leaflet';
import type { CampusLocation } from '../../models/types';
import { toLatLng } from './mapUtils';

// Hand-authored stroke glyphs (white, 24×24 viewBox) per location kind.
// Dataset-driven via location.icon — no hardcoded id checks.
const GLYPHS: Record<string, string> = {
  gate: `<path d="M4 20v-9a4 4 0 0 1 8 0v9"/><path d="M2 20h12"/><path d="M10 20v-6h2v6"/>`,
  library: `<path d="M3 5.5C5.5 5.5 7 6.2 9 7.5c2-1.3 3.5-2 6-2v12c-2.5 0-4 .7-6 2-2-1.3-3.5-2-6-2z"/><path d="M9 7.5v12"/>`,
  building: `<rect x="6" y="3.5" width="12" height="16.5"/><path d="M3.5 20h17"/><path d="M9.5 7h1.5M13 7h1.5M9.5 10.5h1.5M13 10.5h1.5M9.5 14h1.5M13 14h1.5"/>`,
};

function glyphFor(loc: CampusLocation): string {
  return GLYPHS[(loc.icon ?? 'building').toLowerCase()] ?? GLYPHS.building!;
}

function pinColor(loc: CampusLocation, kind: 'default' | 'source' | 'destination'): string {
  if (kind === 'destination') return '#E22126'; // MIET-red destination
  return loc.color ?? '#35363B';
}

function makeIcon(loc: CampusLocation, kind: 'default' | 'source' | 'destination'): L.DivIcon {
  const color = pinColor(loc, kind);
  const selected = kind !== 'default' ? 'miet-pin-selected' : '';
  const html =
    `<div class="${selected}" style="width:34px;height:44px;filter:drop-shadow(0 1px 2px rgba(22,24,29,.35));">` +
    `<svg width="34" height="44" viewBox="0 0 34 44" fill="none" aria-hidden="true">` +
    `<path d="M17 1.5C9.6 1.5 3.5 7.4 3.5 14.6 3.5 24.5 17 42.5 17 42.5S30.5 24.5 30.5 14.6C30.5 7.4 24.4 1.5 17 1.5Z" fill="${color}" stroke="#fff" stroke-width="2"/>` +
    `<g transform="translate(9,6.5)" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none">` +
    `<svg x="0" y="0" width="16" height="16" viewBox="0 0 24 24">${glyphFor(loc)}</svg>` +
    `</g></svg></div>`;
  return L.divIcon({
    className: 'miet-marker',
    html,
    iconSize: [34, 44],
    iconAnchor: [17, 42],
  });
}

export function LocationMarker({
  location,
  kind = 'default',
}: {
  location: CampusLocation;
  kind?: 'default' | 'source' | 'destination';
}) {
  return (
    <Marker
      position={toLatLng(location.mapX, location.mapY)}
      icon={makeIcon(location, kind)}
      title={location.name}
      alt={`${location.name} marker`}
    >
      <Tooltip direction="top" offset={[0, -42]} opacity={1}>
        <strong>{location.name}</strong>
        <br />
        <span>{location.category}</span>
        {kind !== 'default' ? (
          <>
            <br />
            <span>{kind === 'source' ? 'Start' : 'Destination'}</span>
          </>
        ) : null}
      </Tooltip>
    </Marker>
  );
}
