// CSV/JSON import helpers for data operators.
// Headers:
//   locations.csv: id,name,category,type,mapX,mapY[,description]
//   nodes.csv:     id,locationId,mapX,mapY[,type → label]
//   edges.csv:     from,to,distanceMeters[,accessible,blocked]
// Whole-dataset JSON (campus.json shape) is accepted as-is.

import type { CampusLocation, NavigationEdge, NavigationNode } from '../../models/types';

function parseCsv(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))
    .map((line) => line.split(',').map((cell) => cell.trim()));
}

function toBool(raw: string | undefined, fallback: boolean): boolean {
  if (raw === undefined || raw === '') return fallback;
  return ['true', '1', 'yes', 'y'].includes(raw.toLowerCase());
}

export function parseLocationsCsv(text: string): CampusLocation[] {
  const [header, ...rows] = parseCsv(text);
  // Lenient: require at least the first 6 columns in order; 7th (description) optional.
  const need = ['id', 'name', 'category', 'type', 'mapx', 'mapy'];
  const got = (header ?? []).map((h) => h.toLowerCase());
  for (let i = 0; i < need.length; i++) {
    if (got[i] !== need[i]) {
      throw new Error(`locations.csv header must start with: ${need.join(',')}`);
    }
  }
  return rows.map((c) => ({
    id: c[0]!,
    name: c[1]!,
    category: c[2]!,
    description: c[6] ?? undefined,
    type: (c[3] || 'facility') as CampusLocation['type'],
    mapX: Number(c[4]),
    mapY: Number(c[5]),
  }));
}

export function parseNodesCsv(text: string): NavigationNode[] {
  const [header, ...rows] = parseCsv(text);
  const need = ['id', 'locationid', 'mapx', 'mapy'];
  const got = (header ?? []).map((h) => h.toLowerCase());
  for (let i = 0; i < need.length; i++) {
    if (got[i] !== need[i]) throw new Error(`nodes.csv header must start with: ${need.join(',')}`);
  }
  return rows.map((c) => ({
    id: c[0]!,
    locationId: c[1] || undefined,
    x: Number(c[2]),
    y: Number(c[3]),
    label: c[4] || undefined,
  }));
}

export function parseEdgesCsv(text: string): NavigationEdge[] {
  const [header, ...rows] = parseCsv(text);
  const need = ['from', 'to', 'distancemeters'];
  const got = (header ?? []).map((h) => h.toLowerCase());
  for (let i = 0; i < need.length; i++) {
    if (got[i] !== need[i]) throw new Error(`edges.csv header must start with: ${need.join(',')}`);
  }
  return rows.map((c, i) => ({
    id: `EDGE_IMPORT_${i + 1}`,
    from: c[0]!,
    to: c[1]!,
    distanceMeters: Number(c[2]),
    accessible: toBool(c[3], true),
    blocked: toBool(c[4], false),
  }));
}

export const IMPORT_TEMPLATES = {
  locations: 'id,name,category,type,mapX,mapY,description\nLIBRARY,Library,Academic,building,500,180,A campus library location.\n',
  nodes: 'id,locationId,mapX,mapY,label\nNODE_LIBRARY,LIBRARY,500,180,Library front\n',
  edges: 'from,to,distanceMeters,accessible,blocked\nNODE_GATE,NODE_LIBRARY,180,true,false\n',
};
