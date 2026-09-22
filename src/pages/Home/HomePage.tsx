import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Building2, Library } from 'lucide-react';
import { MIETWatermark } from '../../components/brand/MIETWatermark';
import { useApp } from '../../context/AppContext';
import type { CampusLocation } from '../../models/types';

const STEPS: Array<[string, string]> = [
  ['CHOOSE', 'Pick Library or Admin Block.'],
  ['LOCATE', 'We detect your position automatically.'],
  ['ROUTE', 'Shortest path via Dijkstra.'],
  ['WALK', 'Map, distance, time and steps.'],
];

function DestinationIcon({ location }: { location: CampusLocation }) {
  const key = (location.icon ?? 'building').toLowerCase();
  const Icon = key === 'library' ? Library : Building2;
  return (
    <span
      aria-hidden="true"
      className="flex h-11 w-11 shrink-0 items-center justify-center border border-ink-deep/15 bg-white text-ink-deep transition-colors duration-200 group-hover:border-brand/40 group-hover:text-brand-ink"
    >
      <Icon className="h-5 w-5" />
    </span>
  );
}

export function HomePage() {
  const { campus } = useApp();
  const navigate = useNavigate();

  // Destination-first: entrances (Main Gate) are origins, not destinations.
  // Data-driven — future imports adapt automatically.
  const destinations = campus.locations.filter((l) => l.type !== 'entrance');

  return (
    <div className="relative">
      <MIETWatermark position="right" />

      <section className="relative mx-auto max-w-xl pt-6">
        <p className="font-mono text-[11px] font-bold tracking-[0.14em] text-brand-ink">
          MIET · SMART CAMPUS NAVIGATOR
        </p>
        <h1 className="mt-2 text-[32px] font-extrabold leading-[1.05] tracking-[-0.02em] text-ink-deep sm:text-4xl">
          Where do you want to go?
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Choose a campus destination and we&apos;ll guide you there.
        </p>

        <div className="mt-5 border-t border-ink-deep/10" role="list" aria-label="Campus destinations">
          {destinations.map((loc) => (
            <button
              key={loc.id}
              type="button"
              role="listitem"
              onClick={() => navigate(`/navigate?destination=${loc.id}`)}
              className="group flex w-full items-center gap-4 border-b border-ink-deep/10 py-4 text-left transition-colors duration-200 hover:bg-white/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark"
              aria-label={`${loc.name} — get directions`}
            >
              <DestinationIcon location={loc} />
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-bold text-ink-deep">{loc.name}</span>
                <span className="block font-mono text-[11px] tracking-[0.1em] text-ink-soft">
                  {loc.category.toUpperCase()}
                </span>
              </span>
              <ArrowRight
                className="h-5 w-5 shrink-0 text-ink-soft transition-all duration-200 group-hover:translate-x-1 group-hover:text-brand"
                aria-hidden="true"
              />
            </button>
          ))}
        </div>

        <p className="mt-4 text-xs leading-relaxed text-ink-soft">
          Tip: scanning the Main Gate QR opens navigation with your location already confirmed.
        </p>
      </section>

      {/* How it works — borderless ledger strip */}
      <section aria-label="How it works" className="mx-auto mt-10 max-w-xl border-t border-ink-deep/10">
        <ol className="grid grid-cols-2 sm:grid-cols-4">
          {STEPS.map(([k, v], i) => (
            <li
              key={k}
              className={`flex gap-3 py-4 pr-4 ${i > 0 ? 'sm:border-l sm:border-ink-deep/10 sm:pl-4' : ''}`}
            >
              <span aria-hidden="true" className="font-mono text-[11px] font-bold text-brand">
                0{i + 1}
              </span>
              <span>
                <span className="block font-mono text-[11px] font-bold tracking-[0.12em] text-ink-deep">{k}</span>
                <span className="mt-0.5 block text-[13px] text-ink-soft">{v}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <p className="mx-auto mt-2 max-w-xl text-sm">
        <Link to="/explore" className="font-semibold text-brand-ink hover:underline">
          Browse all locations →
        </Link>
      </p>
    </div>
  );
}
