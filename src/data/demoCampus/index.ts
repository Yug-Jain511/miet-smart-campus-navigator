// Single entry point for demo campus data.
// Swap this module with Firestore-backed loading later without touching UI/routing.

import type { NavigationGraph } from '../../models/types';
import { DEMO_EDGES } from './edges';
import { DEMO_LOCATIONS, DEMO_DATA_NOTICE } from './locations';
import { DEMO_NODES } from './nodes';

export { DEMO_DATA_NOTICE, DEMO_LOCATIONS, DEMO_NODES, DEMO_EDGES };

export function getDemoGraph(): NavigationGraph {
  // Return copies so Admin demo edits never mutate the seed constants.
  return {
    nodes: DEMO_NODES.map((n) => ({ ...n })),
    edges: DEMO_EDGES.map((e) => ({ ...e })),
  };
}

export function nodeIdForLocation(locationId: string): string | undefined {
  const map: Record<string, string> = {
    MAIN_GATE: 'NODE_GATE',
    LIBRARY: 'NODE_LIBRARY',
    ADMIN_BLOCK: 'NODE_ADMIN',
  };
  return map[locationId];
}
