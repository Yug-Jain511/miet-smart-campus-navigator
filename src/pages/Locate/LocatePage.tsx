import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Crosshair, Hand, MapPinCheck, QrCode } from 'lucide-react';
import { MIETWatermark } from '../../components/brand/MIETWatermark';
import { CampusMap } from '../../components/map/CampusMap';
import { PositionBadge } from '../../components/map/PositionBadge';
import { Button } from '../../components/ui/Button';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { useApp } from '../../context/AppContext';

/**
 * LOCATE — "Where am I?" utility. Shows positioning state and offers the
 * three location mechanisms. NOT a copy of Navigate; hands off via link.
 */
export function LocatePage() {
  const { campus, position } = useApp();
  const [tapMode, setTapMode] = useState(false);
  const fix = position.fix;

  return (
    <div className="relative">
      <MIETWatermark position="left" />
      <div className="relative">
        <p className="font-mono text-[11px] font-bold tracking-[0.14em] text-brand-ink">
          POSITION UTILITY
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-[-0.01em] text-ink-deep">
          Where am I?
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <PositionBadge fix={fix} />
          {fix.source === 'unknown' ? (
            <span className="font-mono text-[11px] tracking-wide text-ink-soft">
              LOCATION UNKNOWN
            </span>
          ) : null}
        </div>
      </div>

      {position.gpsError ? (
        <div className="relative mt-3">
          <ErrorBanner message={position.gpsError} />
        </div>
      ) : null}
      {fix.note ? (
        <p className="relative mt-3 border border-ink-deep/10 bg-white p-3 text-[13px] text-ink-deep">
          {fix.note}
        </p>
      ) : null}

      <div className="relative mt-4 grid gap-2 sm:grid-cols-3">
        <Button type="button" onClick={() => void position.locateOnce()}>
          <Crosshair className="h-4 w-4" aria-hidden="true" />
          Use My Location
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setTapMode((v) => !v)}
          aria-pressed={tapMode}
        >
          <Hand className="h-4 w-4" aria-hidden="true" />
          {tapMode ? 'Cancel tap' : 'Set Location Manually'}
        </Button>
        <Link
          to="/"
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-control border border-ink-deep/15 bg-white px-4 py-2.5 text-sm font-semibold text-ink-deep transition-all duration-200 hover:-translate-y-px hover:border-ink-deep/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark"
        >
          <MapPinCheck className="h-4 w-4" aria-hidden="true" />
          Navigate Somewhere
        </Link>
      </div>

      <div className="relative mt-3 border border-ink-deep/10 bg-white p-3 text-[13px] text-ink-soft">
        <p className="flex items-start gap-2">
          <QrCode className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            <strong className="text-ink-deep">Scan QR.</strong> Point your camera at a
            Main Gate, Library or Admin Block QR code — it opens navigation with
            that spot confirmed. No in-app scanner needed.
          </span>
        </p>
      </div>

      {tapMode ? (
        <div className="relative mt-4">
          <p className="mb-2 font-mono text-[11px] font-bold tracking-[0.12em] text-ink-soft">
            TAP THE MAP TO SET YOUR POSITION
          </p>
          <CampusMap
            locations={campus.locations}
            graph={campus.graph}
            features={campus.features}
            heightClass="h-[320px]"
            mapTapEnabled
            onMapTap={(x, y) => {
              position.applyManual(x, y, campus.settings.maxSnapMeters);
              setTapMode(false);
            }}
            positionFix={fix.source === 'unknown' ? null : fix}
            showDemoBadge={campus.datasetInfo.isDemo}
          />
        </div>
      ) : null}
    </div>
  );
}
