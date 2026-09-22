// Campus-specific map (Leaflet CRS.Simple demo plane).
// ALL geometry comes from the campus dataset (features + graph) —
// no hardcoded buildings, lawns or trees. Demo shapes live in campus.json.

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { RefObject } from 'react';
import { Circle, MapContainer, Polygon, Polyline, Tooltip, useMapEvents } from 'react-leaflet';
import { DEMO_DATA_NOTICE } from '../../data/demoCampus';
import type { CampusFeature } from '../../data/campus/schema';
import type { CampusLocation, NavigationGraph } from '../../models/types';
import type { PositionFix } from '../../services/positioning/types';
import { CurrentLocationMarker } from './CurrentLocationMarker';
import { LocationMarker } from './LocationMarker';
import { RouteLayer } from './RouteLayer';
import { CAMPUS_BOUNDS, fromLatLng, toLatLng } from './mapUtils';

type Props = {
  locations: CampusLocation[];
  graph: NavigationGraph;
  features?: CampusFeature[];
  routeNodeIds?: string[];
  currentLocationId?: string | null;
  destinationId?: string | null;
  positionFix?: PositionFix | null;
  mapTapEnabled?: boolean;
  onMapTap?: (mapX: number, mapY: number) => void;
  mapRef?: RefObject<L.Map | null>;
  heightClass?: string;
  interactive?: boolean;
  showDemoBadge?: boolean;
};

function MapTapHandler({
  enabled,
  onTap,
}: {
  enabled: boolean;
  onTap: (mapX: number, mapY: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (!enabled) return;
      const { mapX, mapY } = fromLatLng(e.latlng.lat, e.latlng.lng);
      onTap(mapX, mapY);
    },
  });
  return null;
}

function nodePos(graph: NavigationGraph, nodeId: string) {
  const n = graph.nodes.find((x) => x.id === nodeId);
  return toLatLng(n?.x, n?.y);
}

function FeatureLayer({ feature }: { feature: CampusFeature }) {
  if (feature.kind === 'tree') {
    return (
      <Circle
        center={toLatLng(feature.x, feature.y)}
        radius={feature.radius ?? 22}
        pathOptions={{
          color: feature.color ?? '#15803d',
          weight: 1,
          fillColor: feature.fill ?? '#86efac',
          fillOpacity: 1,
        }}
        interactive={false}
      />
    );
  }
  if ((feature.kind === 'lawn' || feature.kind === 'building' || feature.kind === 'gate') && feature.points) {
    return (
      <Polygon
        positions={feature.points.map((p) => toLatLng(p.x, p.y))}
        pathOptions={{
          color: feature.color ?? '#94a3b8',
          weight: feature.kind === 'lawn' ? 1 : 2,
          fillColor: feature.fill ?? '#e2e8f0',
          fillOpacity: 1,
        }}
        interactive={false}
      >
        {feature.label ? (
          <Tooltip direction="top" sticky>
            {feature.label}
          </Tooltip>
        ) : null}
      </Polygon>
    );
  }
  return null;
}

export function CampusMap({
  locations,
  graph,
  features = [],
  routeNodeIds = [],
  currentLocationId = null,
  destinationId = null,
  positionFix = null,
  mapTapEnabled = false,
  onMapTap,
  mapRef,
  heightClass = 'h-[420px]',
  interactive = true,
  showDemoBadge = true,
}: Props) {
  return (
    <div className="relative overflow-hidden rounded-md border border-ink-deep/15 bg-white shadow-md">
      <MapContainer
        ref={mapRef as never}
        crs={L.CRS.Simple}
        bounds={CAMPUS_BOUNDS}
        scrollWheelZoom={interactive}
        dragging={interactive}
        doubleClickZoom={interactive}
        zoomControl={interactive}
        attributionControl={false}
        className={`${heightClass} w-full bg-[#eef3e8]${mapTapEnabled ? ' cursor-crosshair' : ''}`}
        aria-label="MIET demo campus map"
      >
        <MapTapHandler enabled={mapTapEnabled && !!onMapTap} onTap={(x, y) => onMapTap?.(x, y)} />
        {/* Dataset-driven campus shapes */}
        {features.map((f) => (
          <FeatureLayer key={f.id} feature={f} />
        ))}

        {/* Pathways (all walkable edges, faint) */}
        {graph.edges.map((e) => (
          <Polyline
            key={e.id}
            positions={[nodePos(graph, e.from), nodePos(graph, e.to)]}
            pathOptions={
              e.blocked
                ? { color: '#ef4444', weight: 4, dashArray: '6 8', opacity: 0.9 }
                : { color: '#ffffff', weight: 8, opacity: 1 }
            }
            interactive={false}
          />
        ))}
        {graph.edges.map((e) =>
          e.blocked ? null : (
            <Polyline
              key={`${e.id}-inner`}
              positions={[nodePos(graph, e.from), nodePos(graph, e.to)]}
              pathOptions={{ color: '#cbd5e1', weight: 3, dashArray: '2 6', opacity: 1 }}
              interactive={false}
            />
          ),
        )}

        {/* Calculated route on top */}
        <RouteLayer routeNodeIds={routeNodeIds} nodes={graph.nodes} />

        {/* Live user position (source-honest marker) */}
        {positionFix ? <CurrentLocationMarker fix={positionFix} graph={graph} /> : null}

        {/* Location pins on top */}
        {locations.map((loc) => (
          <LocationMarker
            key={loc.id}
            location={loc}
            kind={
              loc.id === currentLocationId && loc.id === destinationId
                ? 'source'
                : loc.id === currentLocationId
                  ? 'source'
                  : loc.id === destinationId
                    ? 'destination'
                    : 'default'
            }
          />
        ))}
      </MapContainer>

      {/* DEMO strip — required constraint, integrated into the frame */}
      {showDemoBadge ? (
        <div className="pointer-events-none absolute left-0 top-0 bg-ink-deep/85 px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.1em] text-white">
          {DEMO_DATA_NOTICE}
        </div>
      ) : null}
      <div className="pointer-events-none absolute bottom-2.5 right-2.5 bg-white/90 px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-ink-soft">
        DEMO LAYOUT — NOT TO SCALE
      </div>
    </div>
  );
}
