// DEMO DATA — Replace with actual MIET campus survey data.
// Fictional node positions on the 0–1000 demo plane.
// Junctions (no locationId) form the temporary pedestrian network; they are
// not destinations and never appear in search/QR.

import type { NavigationNode } from '../../models/types';

export const DEMO_NODES: NavigationNode[] = [
  { id: 'NODE_GATE', locationId: 'MAIN_GATE', x: 100, y: 500, label: 'Gate junction' },
  { id: 'JUNCTION_01', x: 300, y: 470, label: 'Demo walkway junction 01' },
  { id: 'JUNCTION_02', x: 420, y: 300, label: 'Demo walkway junction 02' },
  { id: 'JUNCTION_03', x: 640, y: 470, label: 'Demo walkway junction 03' },
  { id: 'NODE_LIBRARY', locationId: 'LIBRARY', x: 500, y: 180, label: 'Library front' },
  { id: 'NODE_ADMIN', locationId: 'ADMIN_BLOCK', x: 880, y: 500, label: 'Admin front' },
];
