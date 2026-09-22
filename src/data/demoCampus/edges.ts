// DEMO DATA — Replace with actual MIET campus survey data.
// Fictional walking distances (meters). Edges are undirected walkable paths.
// Temporary pedestrian network: Gate → J1 → {J2 → Library | J3 → Admin},
// plus a J2–J3 cross-link so one blocked edge still allows rerouting.

import type { NavigationEdge } from '../../models/types';

export const DEMO_EDGES: NavigationEdge[] = [
  {
    id: 'EDGE_GATE_J1',
    from: 'NODE_GATE',
    to: 'JUNCTION_01',
    distanceMeters: 90,
    accessible: true,
    blocked: false,
  },
  {
    id: 'EDGE_J1_J2',
    from: 'JUNCTION_01',
    to: 'JUNCTION_02',
    distanceMeters: 110,
    accessible: true,
    blocked: false,
  },
  {
    id: 'EDGE_J2_LIBRARY',
    from: 'JUNCTION_02',
    to: 'NODE_LIBRARY',
    distanceMeters: 100,
    accessible: true,
    blocked: false,
  },
  {
    id: 'EDGE_J1_J3',
    from: 'JUNCTION_01',
    to: 'JUNCTION_03',
    distanceMeters: 130,
    accessible: true,
    blocked: false,
  },
  {
    id: 'EDGE_J3_ADMIN',
    from: 'JUNCTION_03',
    to: 'NODE_ADMIN',
    distanceMeters: 120,
    accessible: true,
    blocked: false,
  },
  {
    id: 'EDGE_J2_J3',
    from: 'JUNCTION_02',
    to: 'JUNCTION_03',
    distanceMeters: 140,
    accessible: true,
    blocked: false,
  },
];
