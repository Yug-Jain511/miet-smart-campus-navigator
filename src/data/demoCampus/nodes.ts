// DEMO DATA — Replace with actual MIET campus survey data.
// Fictional node positions on the 0–1000 demo plane.

import type { NavigationNode } from '../../models/types';

export const DEMO_NODES: NavigationNode[] = [
  { id: 'NODE_GATE', locationId: 'MAIN_GATE', x: 100, y: 500, label: 'Gate junction' },
  { id: 'NODE_LIBRARY', locationId: 'LIBRARY', x: 500, y: 180, label: 'Library front' },
  { id: 'NODE_ADMIN', locationId: 'ADMIN_BLOCK', x: 880, y: 500, label: 'Admin front' },
];
