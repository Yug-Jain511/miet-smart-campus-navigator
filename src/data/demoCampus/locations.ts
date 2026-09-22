// DEMO DATA — Replace with actual MIET campus survey data.
// All coordinates, distances and pathways below are FICTIONAL placeholders.
// Locked to exactly 3 MVP locations: MAIN_GATE, LIBRARY, ADMIN_BLOCK.

import type { CampusLocation } from '../../models/types';

export const DEMO_DATA_NOTICE =
  'DEMO CAMPUS DATA — Replace with actual MIET survey data';

export const DEMO_LOCATIONS: CampusLocation[] = [
  {
    id: 'MAIN_GATE',
    name: 'Main Gate',
    category: 'Entrance',
    description: 'Main entrance of the MIET campus. Start here after scanning the gate QR.',
    type: 'entrance',
    mapX: 100,
    mapY: 500,
    qrCodeId: 'QR_MAIN_GATE',
  },
  {
    id: 'LIBRARY',
    name: 'Library',
    category: 'Academic',
    description: 'A campus library location.',
    type: 'building',
    mapX: 500,
    mapY: 180,
    qrCodeId: 'QR_LIBRARY',
  },
  {
    id: 'ADMIN_BLOCK',
    name: 'Admin Block',
    category: 'Administration',
    description: 'Administrative offices and student services.',
    type: 'building',
    mapX: 880,
    mapY: 500,
    qrCodeId: 'QR_ADMIN_BLOCK',
  },
];

export function getLocationById(id: string): CampusLocation | undefined {
  return DEMO_LOCATIONS.find((l) => l.id === id);
}
