// AI-ready natural-language destination resolver.
// MVP implementation: normalization + aliases + keyword matching only.
// NOT machine learning. A future LLM/ML model can replace this function
// behind the same signature.

import type { CampusLocation } from '../../models/types';
import { searchDestinations, normalizeQuery } from '../location/searchService';

const FILLER_WORDS = [
  'where',
  'is',
  'the',
  'take',
  'me',
  'to',
  'go',
  'show',
  'find',
  'navigate',
  'directions',
  'please',
  'i',
  'want',
  'need',
  'how',
  'do',
  'get',
  'reach',
  'reaching',
  'a',
  'an',
];

/** e.g. "where is the library?" → LIBRARY; "take me to admin" → ADMIN_BLOCK. */
export function findDestinationFromQuery(
  query: string,
  corpus?: CampusLocation[],
): CampusLocation | null {
  const cleaned = normalizeQuery(query);
  if (!cleaned) return null;

  // Try the raw query first (handles "lib", "admin", "gate").
  const direct = searchDestinations(cleaned, corpus);
  if (direct.length > 0) return direct[0];

  // Strip filler words and retry ("where is the library" → "library").
  const keywords = cleaned
    .split(/\s+/)
    .filter((w) => !FILLER_WORDS.includes(w))
    .join(' ')
    .trim();
  if (keywords && keywords !== cleaned) {
    const retry = searchDestinations(keywords, corpus);
    if (retry.length > 0) return retry[0];
  }
  return null;
}
