// Geographic route map for REAL GPX walking tracks (lat/lng).
// Standard Leaflet (EPSG3857) + OSM tiles — NEVER CRS.Simple: real-world
// coordinates must never be fed into the fictional demo plane.
// The demo-plane CampusMap stays untouched for Admin/graph tooling.

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { RefObject } from 'react';
import { useEffect } from 'react';
import { Circle, MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import type { LatLng } from '../../services/routes/gpxGeometry';
import type { PositionFix } from '../../services/positioning/types';

function pinIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: 'miet-marker',
    html:
      `<div style="width:34px;height:44px;filter:drop-shadow(0 1px 2px rgba(22,24,29,.35));">` +
      `<svg width="34" height="44" viewBox="0 0 34 44" fill="none" aria-hidden="true">` +
      `<path d="M17 1.5C9.6 1.5 3.5 7.4 3.5 14.6 3.5 24.5 17 42.5 17 42.5S30.5 24.5 30.5 14.6C30.5 7.4 24.4 1.5 17 1.5Z" fill="${color}" stroke="#fff" stroke-width="2"/>` +
      `<circle cx="17" cy="14.5" r="5" fill="#fff"/></svg></div>`,
    iconSize: [34, 44],
    iconAnchor: [17, 42],
  });
}

function userDot(): L.DivIcon {
  return L.divIcon({
    className: 'miet-marker',
    html: `<div style="position:relative;width:22px;height:22px;">
      <span style="position:absolute;inset:0;border-radius:9999px;background:#1668dc;opacity:0.35;animation:miet-ping 1.8s ease-out infinite;"></span>
      <span style="position:absolute;inset:3px;border-radius:9999px;background:#1668dc;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4);"></span>
    </div>
    <style>@keyframes miet-ping{0%{transform:scale(.6);opacity:.5}80%,100%{transform:scale(1.6);opacity:0}}</style>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

function MapTapHandler({
  enabled,
  onTap,
}: {
  enabled: boolean;
  onTap: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (enabled) onTap(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FitOnLoad({ points }: { points: LatLng[] }) {  const map = useMap();
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const onTileError = () => {
      // eslint-disable-next-line no-console
      console.warn('[map-debug] basemap tile failed to load — check network access to the tile provider.');
    };
    map.on('tileerror', onTileError);
    return () => {
      map.off('tileerror', onTileError);
    };
  }, [map]);
  useEffect(() => {
    if (points.length === 0) return;
    map.fitBounds(
      L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number])).pad(0.2),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points]);
  return null;
}

export type GpxMarker = {
  position: LatLng;
  label: string;
  sub: string;
};

export function GpxRouteMap({
  points,
  origin,
  destination,
  userFix = null,
  mapRef,
  heightClass = 'h-[62vh] min-h-[380px] lg:h-[68vh]',
  mapTapEnabled = false,
  onMapTap,
}: {
  /** Real track points in walking order — the visible blue route. */
  points: LatLng[];
  origin: GpxMarker;
  destination: GpxMarker;
  /** Live GPS fix (real lat/lng + real accuracy only). */
  userFix?: PositionFix | null;
  mapRef?: RefObject<L.Map | null>;
  heightClass?: string;
  mapTapEnabled?: boolean;
  onMapTap?: (lat: number, lng: number) => void;
}) {
  const line: Array<[number, number]> = points.map((p) => [p.lat, p.lng]);
  const center: [number, number] =
    points.length > 0
      ? [points[0]!.lat, points[0]!.lng]
      : [origin.position.lat, origin.position.lng];
  const showUser =
    userFix &&
    userFix.latitude !== undefined &&
    userFix.longitude !== undefined &&
    userFix.source !== 'unknown';
  const accuracy =
    showUser && userFix!.accuracyMeters !== undefined && Number.isFinite(userFix!.accuracyMeters)
      ? userFix!.accuracyMeters!
      : 0;

  return (
    <div className="relative overflow-hidden rounded-md border border-ink-deep/15 bg-white shadow-md">
      <MapContainer
        ref={mapRef as never}
        center={center}
        zoom={17}
        scrollWheelZoom
        attributionControl
        className={`${heightClass} w-full${mapTapEnabled ? ' cursor-crosshair' : ''}`}
        aria-label="MIET walking route map"
      >
        <MapTapHandler enabled={mapTapEnabled && !!onMapTap} onTap={(la, ln) => onMapTap?.(la, ln)} />
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <FitOnLoad points={points} />
        {line.length >= 2 ? (
          <>
            <Polyline positions={line} pathOptions={{ color: '#ffffff', weight: 9, opacity: 1, lineCap: 'round' }} />
            <Polyline
              positions={line}
              pathOptions={{
                color: '#1668dc',
                weight: 5,
                opacity: 1,
                lineJoin: 'round',
                lineCap: 'round',
                className: 'miet-route-line',
              }}
            />
          </>
        ) : null}
        <Marker
          position={[origin.position.lat, origin.position.lng]}
          icon={pinIcon('#35363B')}
          title={origin.label}
          alt={`${origin.label} marker`}
          zIndexOffset={1000}
        >
          <Tooltip direction="top" offset={[0, -42]} opacity={1}>
            <strong>{origin.label}</strong>
            <br />
            <span>{origin.sub}</span>
          </Tooltip>
        </Marker>
        <Marker
          position={[destination.position.lat, destination.position.lng]}
          icon={pinIcon('#E22126')}
          title={destination.label}
          alt={`${destination.label} marker`}
          zIndexOffset={1000}
        >
          <Tooltip direction="top" offset={[0, -42]} opacity={1}>
            <strong>{destination.label}</strong>
            <br />
            <span>{destination.sub}</span>
          </Tooltip>
        </Marker>
        {showUser ? (
          <>
            {accuracy > 0 ? (
              <Circle
                center={[userFix!.latitude!, userFix!.longitude!]}
                radius={accuracy}
                pathOptions={{ color: '#1668dc', weight: 1, fillColor: '#1668dc', fillOpacity: 0.15 }}
                interactive={false}
              />
            ) : null}
            <Marker
              position={[userFix!.latitude!, userFix!.longitude!]}
              icon={userDot()}
              alt="Your location"
              zIndexOffset={2000}
            >
              <Tooltip direction="top" offset={[0, -12]} opacity={1}>
                Your location
                {accuracy > 0 ? ` (±${Math.round(accuracy)} m)` : ''}
              </Tooltip>
            </Marker>
          </>
        ) : null}
      </MapContainer>
      <div className="pointer-events-none absolute left-0 top-0 bg-ink-deep/85 px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.1em] text-white">
        REAL GPS TRACK · MIET CAMPUS
      </div>
    </div>
  );
}
