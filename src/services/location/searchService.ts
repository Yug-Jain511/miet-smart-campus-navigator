// Destination search: case-insensitive, partial + basic fuzzy matching.
// Corpus-driven: pass campus locations; defaults to the demo table.
// Aliases come from location.aliases first, then the built-in table.

import { DEMO_LOCATIONS } from '../../data/demoCampus/locations';
import { LOCATION_ALIASES } from '../../data/demoCampus/aliases';
import type { CampusLocation } from '../../models/types';

export function normalizeQuery(raw: string): string {
  return raw.toLowerCase().trim().replace(/[?.!,;:'"()]/g, '');
}

/** True if query is a subsequence of target ("lbr" matches "library"). */
function isSubsequence(query: string, target: string): boolean {
  let qi = 0;
  for (let ti = 0; ti < target.length && qi < query.length; ti++) {
    if (target[ti] === query[qi]) qi++;
  }
  return qi === query.length;
}

function aliasesFor(loc: CampusLocation): string[] {
  if (loc.aliases && loc.aliases.length > 0) return loc.aliases.map((a) => a.toLowerCase());
  return LOCATION_ALIASES[loc.id] ?? [];
}

function scoreLocation(query: string, loc: CampusLocation): number {
  const name = loc.name.toLowerCase();
  const id = loc.id.toLowerCase();
  if (name === query || id === query.replace(/\s+/g, '_')) return 100;
  const aliases = aliasesFor(loc);
  if (aliases.includes(query)) return 90;
  if (name.startsWith(query)) return 80;
  if (name.includes(query)) return 70;
  if (aliases.some((a) => a.startsWith(query))) return 60;
  if (aliases.some((a) => a.includes(query))) return 50;
  if (isSubsequence(query.replace(/\s+/g, ''), name.replace(/\s+/g, ''))) return 30;
  return 0;
}

export function searchDestinations(
  query: string,
  corpus: CampusLocation[] = DEMO_LOCATIONS,
): CampusLocation[] {
  const q = normalizeQuery(query);
  if (!q) return [...corpus];
  return corpus
    .map((loc) => ({ loc, score: scoreLocation(q, loc) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.loc);
}
