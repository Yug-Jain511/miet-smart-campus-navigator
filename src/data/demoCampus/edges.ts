// DEMO DATA — Replace with actual MIET campus survey data.
// Fictional walking distances (meters). Edges are undirected walkable paths.

import type { NavigationEdge } from '../../models/types';

export const DEMO_EDGES: NavigationEdge[] = [
  {
    id: 'EDGE_GATE_LIBRARY',
    from: 'NODE_GATE',
    to: 'NODE_LIBRARY',
    distanceMeters: 180,
    accessible: true,
    blocked: false,
  },
  {
    id: 'EDGE_GATE_ADMIN',
    from: 'NODE_GATE',
    to: 'NODE_ADMIN',
    distanceMeters: 220,
    accessible: true,
    blocked: false,
  },
  {
    id: 'EDGE_LIBRARY_ADMIN',
    from: 'NODE_LIBRARY',
    to: 'NODE_ADMIN',
    distanceMeters: 150,
    accessible: true,
    blocked: false,
  },
];
