import { Link } from 'react-router-dom';
import { ArrowRight, Compass } from 'lucide-react';
import { MIETWatermark } from '../../components/brand/MIETWatermark';
import { useApp } from '../../context/AppContext';
import { CampusMap } from '../../components/map/CampusMap';

const STEPS: Array<[string, string]> = [
  ['SCAN', 'Main Gate QR sets your position.'],
  ['SEARCH', 'Library or Admin Block.'],
  ['ROUTE', 'Shortest path via Dijkstra.'],
  ['WALK', 'Map, distance, time, steps.'],
];

export function HomePage() {
  const { campus } = useApp();

  return (
    <div className="relative">
      <MIETWatermark position="right" />

      {/* Compact product hero */}
      <section className="relative grid gap-8 pt-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-end">
        <div className="pb-1">
          <p className="font-mono text-[11px] font-bold tracking-[0.14em] text-brand-ink">
            MIET · CAMPUS NAVIGATION
          </p>
          <h1 className="mt-2 text-[32px] font-extrabold leading-[1.05] tracking-[-0.02em] text-ink-deep sm:text-4xl">
            Navigate MIET.
            <br />
            <span className="text-ink-soft">Know where to go.</span>
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-soft">
            Walking directions between campus locations — scan a QR, pick a destination, follow the route.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              to="/navigate"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-control bg-brand px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-px hover:bg-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark"
            >
              Start Navigation
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              to="/explore"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-control border border-ink-deep/15 bg-white px-5 py-2.5 text-sm font-semibold text-ink-deep transition-all duration-200 hover:-translate-y-px hover:border-ink-deep/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark"
            >
              <Compass className="h-4 w-4" aria-hidden="true" />
              Explore Campus
            </Link>
          </div>
        </div>

        <div>
          <CampusMap
            locations={campus.locations}
            graph={campus.graph}
            features={campus.features}
            heightClass="h-[320px] sm:h-[400px]"
            showDemoBadge={campus.datasetInfo.isDemo}
          />
          <p className="mt-2 flex items-baseline justify-between font-mono text-[11px] tracking-wide text-ink-soft">
            <span>POWERED BY THE MIET CAMPUS MAP</span>
            <Link to="/navigate" className="font-bold text-brand-ink hover:underline">
              OPEN NAVIGATOR →
            </Link>
          </p>
        </div>
      </section>

      {/* How it works — borderless ledger strip */}
      <section aria-label="How it works" className="mt-10 border-t border-ink-deep/10">
        <ol className="grid sm:grid-cols-4">
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
    </div>
  );
}
