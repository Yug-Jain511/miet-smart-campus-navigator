import { AlertTriangle, MapPinCheck, Satellite, Hand } from 'lucide-react';
import type { PositionFix } from '../../services/positioning/types';

/** Flat source chip — no pill shadow, 6px radius, restrained type. */
export function PositionBadge({ fix }: { fix: PositionFix }) {
  const base =
    'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-bold tracking-wide';
  if (fix.source === 'qr') {
    return (
      <p className={`${base} border-green-800/20 bg-green-50 text-green-800`}>
        <MapPinCheck className="h-3.5 w-3.5" aria-hidden="true" />
        QR CONFIRMED
      </p>
    );
  }
  if (fix.source === 'gps') {
    const acc =
      fix.accuracyMeters !== undefined && Number.isFinite(fix.accuracyMeters)
        ? ` · ±${Math.round(fix.accuracyMeters)} m`
        : '';
    const low = fix.confidence === 'low';
    return (
      <p
        className={`${base} ${
          low
            ? 'border-amber-700/25 bg-amber-50 text-amber-900'
            : 'border-primary-700/20 bg-primary-50 text-primary-700'
        }`}
      >
        {low ? (
          <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
        ) : (
          <Satellite className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        GPS ESTIMATED{acc}
      </p>
    );
  }
  if (fix.source === 'manual') {
    return (
      <p className={`${base} border-ink-deep/15 bg-white text-ink-soft`}>
        <Hand className="h-3.5 w-3.5" aria-hidden="true" />
        MANUAL POSITION
      </p>
    );
  }
  return null;
}
