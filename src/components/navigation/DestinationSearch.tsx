import { useMemo, useState } from 'react';
import { Building2, DoorOpen, Library, Search } from 'lucide-react';
import { findDestinationFromQuery } from '../../services/ai/destinationResolver';
import { searchDestinations } from '../../services/location/searchService';
import type { CampusLocation } from '../../models/types';

function iconFor(loc: CampusLocation) {
  const key = (loc.icon ?? 'building').toLowerCase();
  if (key === 'gate') return <DoorOpen className="h-4 w-4" aria-hidden="true" />;
  if (key === 'library') return <Library className="h-4 w-4" aria-hidden="true" />;
  return <Building2 className="h-4 w-4" aria-hidden="true" />;
}

export function DestinationSearch({
  onPick,
  compact = false,
  locations,
}: {
  onPick: (loc: CampusLocation) => void;
  compact?: boolean;
  /** Campus corpus (dataset-driven). Defaults to the demo table. */
  locations?: CampusLocation[];
}) {
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchDestinations(query, locations), [query, locations]);
  const nlHint = useMemo(
    () => (query.length > 2 ? findDestinationFromQuery(query, locations) : null),
    [query, locations],
  );

  return (
    <div>
      <label htmlFor="destination-search" className="sr-only">
        Search campus destination
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" aria-hidden="true" />
        <input
          id="destination-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search campus destination..."
          autoComplete="off"
          className="w-full rounded-control border border-ink-deep/20 bg-white py-2.5 pl-10 pr-3 text-sm text-ink-deep placeholder:text-ink-soft/70 focus:border-ink-deep/40 focus:outline-none focus:ring-2 focus:ring-brand/25"
        />
      </div>
      {query && (
        <ul className={`mt-1.5 overflow-hidden rounded-control border border-ink-deep/10 bg-white shadow ${compact ? 'max-h-44' : ''} overflow-y-auto`} role="listbox" aria-label="Matching destinations">
          {results.length === 0 ? (
            <li className="px-4 py-3 text-sm text-ink-soft">No campus places match “{query}”.</li>
          ) : (
            results.map((loc) => (
              <li key={loc.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={false}
                  onClick={() => {
                    onPick(loc);
                    setQuery(loc.name);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-ink-deep transition-colors duration-150 hover:bg-paper focus:bg-paper focus:outline-none"
                >
                  <span className="text-ink-soft">{iconFor(loc)}</span>
                  <span>
                    <span className="block font-semibold">{loc.name}</span>
                    <span className="block text-xs text-ink-soft">{loc.category}</span>
                  </span>
                  {nlHint?.id === loc.id ? (
                    <span className="ml-auto px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider text-brand-ink">
                      BEST MATCH
                    </span>
                  ) : null}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
