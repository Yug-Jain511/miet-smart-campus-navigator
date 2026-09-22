// Plain-language directions derived from node metadata.
// No fake left/right turns: geometry is demo-only, so we use "towards" phrasing.
// nameOf resolves display names (dataset-driven); defaults to the demo table.

import type { NavigationNode } from '../../models/types';
import { getLocationById } from '../../data/demoCampus/locations';

function defaultNameOf(locationId: string | undefined, fallback: string): string {
  if (!locationId) return fallback;
  return getLocationById(locationId)?.name ?? fallback;
}

function nodeLabel(
  node: NavigationNode | undefined,
  nameOf: (locationId: string | undefined, fallback: string) => string,
): string {
  if (!node) return 'next point';
  return nameOf(node.locationId, node.label ?? node.id);
}

export function buildDirections(
  pathNodeIds: string[],
  nodes: NavigationNode[],
  edgeDistance: (from: string, to: string) => number,
  nameOf: (locationId: string | undefined, fallback: string) => string = defaultNameOf,
): string[] {
  if (pathNodeIds.length === 0) return [];
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const startName = nodeLabel(byId.get(pathNodeIds[0]), nameOf);
  const endName = nodeLabel(byId.get(pathNodeIds[pathNodeIds.length - 1]), nameOf);

  if (pathNodeIds.length === 1) {
    return [`You are already at ${endName}.`];
  }

  const steps: string[] = [];
  steps.push(`Start at ${startName}.`);
  for (let i = 0; i < pathNodeIds.length - 1; i++) {
    const from = byId.get(pathNodeIds[i]);
    const to = byId.get(pathNodeIds[i + 1]);
    const toName = nodeLabel(to, nameOf);
    const dist = Math.round(edgeDistance(pathNodeIds[i], pathNodeIds[i + 1]));
    if (i === pathNodeIds.length - 2) {
      steps.push(`Walk towards ${toName} for about ${dist} m.`);
      steps.push(`${toName} is ahead on your route.`);
    } else {
      void from;
      steps.push(`Walk towards ${toName} for about ${dist} m, then continue.`);
    }
  }
  steps.push(`You have arrived at ${endName}.`);
  return steps;
}
