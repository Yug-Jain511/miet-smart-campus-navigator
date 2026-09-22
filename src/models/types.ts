// Central TypeScript models for MIET Smart Campus Navigator.
// Keep this file types-only (no logic) so UI, services and data stay decoupled.

export type LocationType = 'entrance' | 'building' | 'facility' | 'junction' | 'landmark';

export type CampusLocation = {
  id: string;
  name: string;
  category: string;
  description?: string;
  type: LocationType;
  /** Demo plane coords in 0–1000 CRS.Simple space. Fictional demo data. */
  mapX?: number;
  mapY?: number;
  latitude?: number;
  longitude?: number;
  /**
   * Provenance of lat/lng. 'verified-gps' = real surveyed/reference coordinate
   * (today: MAIN_GATE only). 'demo' = fictional or absent. GPS proximity may
   * only anchor to 'verified-gps' coordinates — never fabricate the rest.
   */
  coordinateSource?: 'verified-gps' | 'demo';
  /** Optional external reference (e.g. Street View / Maps id). Metadata only. */
  streetViewReferenceId?: string;
  floor?: string;
  qrCodeId?: string;
  /** Marker color (hex). Defaults apply when absent. */
  color?: string;
  /** Marker glyph key: 'gate' | 'library' | 'building'. Defaults to 'building'. */
  icon?: string;
  /** Search aliases. Merged with built-in alias table. */
  aliases?: string[];
};

export type NavigationNode = {
  id: string;
  /** Optional link to a CampusLocation id. */
  locationId?: string;
  x?: number;
  y?: number;
  label?: string;
};

export type NavigationEdge = {
  id: string;
  from: string;
  to: string;
  distanceMeters: number;
  walkingTimeSeconds?: number;
  accessible?: boolean;
  blocked?: boolean;
};

export type NavigationGraph = {
  nodes: NavigationNode[];
  edges: NavigationEdge[];
};

export type RouteResult = {
  nodeIds: string[];
  /** Ordered location ids along the route (derived from nodes). */
  locationIds: string[];
  totalDistanceMeters: number;
  estimatedWalkingTimeSeconds: number;
  directions: string[];
};

export type CampusQRCode = {
  id: string;
  locationId: string;
  label: string;
  url: string;
  active: boolean;
};

// Future 360° panorama support (architecturally separate — no pipeline in MVP).
export type PanoramaPoint = {
  id: string;
  locationId: string;
  imageUrl?: string;
  heading?: number;
  connectedPoints?: string[];
};
