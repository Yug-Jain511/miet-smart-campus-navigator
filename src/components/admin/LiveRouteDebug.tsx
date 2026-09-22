import { routeToLatLngs } from '../map/mapUtils';
import { useApp } from '../../context/AppContext';
import { formatDistance, formatWalkingTime } from '../../services/routing/walkingTime';

/** Admin-only live route diagnostics. Never shown in student UI. */
export function LiveRouteDebug() {
  const { campus, journey } = useApp();
  const nodeByLoc = new Map(campus.graph.nodes.map((n) => [n.locationId ?? '', n.id]));
  const route = journey.route;
  const coords = route ? routeToLatLngs(route.nodeIds, campus.graph.nodes) : null;

  const rows: Array<[string, string]> = [
    ['Current location', journey.currentLocationId ?? '—'],
    ['Destination', journey.destinationId ?? '—'],
    [
      'Source node',
      journey.currentLocationId ? (nodeByLoc.get(journey.currentLocationId) ?? 'MISSING') : '—',
    ],
    [
      'Destination node',
      journey.destinationId ? (nodeByLoc.get(journey.destinationId) ?? 'MISSING') : '—',
    ],
    ['Route node IDs', route ? route.nodeIds.join(' → ') : journey.route === null ? 'NULL (no path)' : '— (not requested)'],
    [
      'Route coords',
      coords ? coords.map(([lat, lng]) => `[${lat.toFixed(1)}, ${lng.toFixed(1)}]`).join(' ') : '—',
    ],
    ['Distance', route ? formatDistance(route.totalDistanceMeters) : '—'],
    ['ETA', route ? formatWalkingTime(route.estimatedWalkingTimeSeconds) : '—'],
  ];

  return (
    <div className="mt-3 border border-ink-deep/10 bg-white p-3">
      <h3 className="font-mono text-[11px] font-bold tracking-[0.12em] text-ink-soft">
        LIVE ROUTE DEBUG · ADMIN ONLY
      </h3>
      <dl className="mt-1 space-y-0.5 font-mono text-[11px]">
        {rows.map(([k, v]) => (
          <div key={k} className="flex gap-2">
            <dt className="shrink-0 font-bold text-ink-soft">{k}:</dt>
            <dd className="break-all text-ink-deep">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
