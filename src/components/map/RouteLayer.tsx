import { Polyline } from 'react-leaflet';
import type { NavigationNode } from '../../models/types';
import { routeToLatLngs } from './mapUtils';

/** Blue highlighted walking route through ordered node ids. */
export function RouteLayer({
  routeNodeIds,
  nodes,
}: {
  routeNodeIds: string[];
  nodes: NavigationNode[];
}) {
  if (routeNodeIds.length < 2) return null;
  const positions = routeToLatLngs(routeNodeIds, nodes);
  return (
    <>
      {/* casing */}
      <Polyline positions={positions} pathOptions={{ color: '#ffffff', weight: 9, opacity: 1 }} />
      {/* route line — draws in via .miet-route-line (motion-safe) */}
      <Polyline
        positions={positions}
        pathOptions={{ color: '#1668dc', weight: 5, opacity: 1, lineJoin: 'round', className: 'miet-route-line' }}
      />
    </>
  );
}
