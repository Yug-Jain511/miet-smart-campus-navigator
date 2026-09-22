// DEMO DATA — Replace with actual MIET campus survey data.
// Map positions, distances and pathways below are FICTIONAL placeholders.
// The three latitude/longitude anchors are REAL verified reference points;
// everything else about these locations (mapX/mapY, paths, distances) is demo.
// Locked to exactly 3 MVP locations: MAIN_GATE, LIBRARY, ADMIN_BLOCK.

import type { CampusLocation } from '../../models/types';

export const DEMO_DATA_NOTICE =
  'DEMO CAMPUS DATA — Replace with actual MIET survey data';

export const DEMO_LOCATIONS: CampusLocation[] = [  {
    id: 'MAIN_GATE',
    name: 'Main Gate',
    category: 'Entrance',
    description: 'Main entrance of the MIET campus. Start here after scanning the gate QR.',
    type: 'entrance',
    mapX: 100,
    mapY: 500,
    // REAL verified reference coordinate (Google Maps). Do not fabricate others.
    latitude: 28.972317820229662,
    longitude: 77.64158190939098,
    coordinateSource: 'verified-gps',
    streetViewReferenceId: 'Ye1A2rb7aAF2KGpW_77PXg',
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
    // REAL verified reference coordinate (Google Maps).
    latitude: 28.972946691259995,
    longitude: 77.64081479761072,
    coordinateSource: 'verified-gps',
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
    // REAL verified reference coordinate (Google Maps).
    latitude: 28.972574766129807,
    longitude: 77.64114336820761,
    coordinateSource: 'verified-gps',
    qrCodeId: 'QR_ADMIN_BLOCK',
  },
];

export function getLocationById(id: string): CampusLocation | undefined {
  return DEMO_LOCATIONS.find((l) => l.id === id);
}
