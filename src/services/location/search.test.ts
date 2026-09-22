import { describe, expect, it } from 'vitest';
import { findDestinationFromQuery } from '../ai/destinationResolver';
import { searchDestinations } from './searchService';

describe('destination search', () => {
  it('matches partial, case-insensitive queries', () => {
    expect(searchDestinations('lib')[0]?.id).toBe('LIBRARY');
    expect(searchDestinations('ADMIN')[0]?.id).toBe('ADMIN_BLOCK');
    expect(searchDestinations('gate')[0]?.id).toBe('MAIN_GATE');
  });

  it('matches aliases and fuzzy subsequences', () => {
    expect(searchDestinations('books')[0]?.id).toBe('LIBRARY');
    expect(searchDestinations('office')[0]?.id).toBe('ADMIN_BLOCK');
    expect(searchDestinations('lbr')[0]?.id).toBe('LIBRARY');
  });

  it('returns empty for unknown places, all for empty query', () => {
    expect(searchDestinations('canteen')).toEqual([]);
    expect(searchDestinations('')).toHaveLength(3);
  });

  it('resolves natural-language queries (keyword matching, not ML)', () => {
    expect(findDestinationFromQuery('where is the library?')?.id).toBe('LIBRARY');
    expect(findDestinationFromQuery('take me to admin')?.id).toBe('ADMIN_BLOCK');
    expect(findDestinationFromQuery('how do I reach the main gate?')?.id).toBe('MAIN_GATE');
    expect(findDestinationFromQuery('where is the canteen?')).toBeNull();
  });

  it('searches operator corpora without code changes', () => {
    const corpus = [
      { id: 'X', name: 'Xenon Lab', category: 'Lab', type: 'facility' as const, aliases: ['xenon'] },
    ];
    expect(searchDestinations('xen', corpus)[0]?.id).toBe('X');
  });
});
