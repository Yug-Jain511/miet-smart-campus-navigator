import { Crosshair, LocateFixed, Maximize, Navigation } from 'lucide-react';
import { memo } from 'react';
import type { PositionFix } from '../../services/positioning/types';

export type MapControlAction = 'locate' | 'recenter' | 'fit-route' | 'start';

function ControlButton({
  label,
  onClick,
  children,
  primary = false,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`flex h-11 w-11 items-center justify-center rounded-control shadow ring-1 ring-ink-deep/10 transition-all duration-200 hover:-translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark ${
        primary
          ? 'bg-brand text-white hover:bg-brand-dark'
          : 'bg-white/95 text-ink-deep hover:bg-white'
      }`}
    >
      {children}
    </button>
  );
}

/**
 * Floating map controls (rendered over the Leaflet map by the page).
 * Locate = GPS fix; Recenter = center on position; Fit = fit route bounds.
 */
export const MapControls = memo(function MapControls({
  fix,
  hasRoute,
  tracking,
  onLocate,
  onRecenter,
  onFitRoute,
}: {
  fix: PositionFix;
  hasRoute: boolean;
  tracking: boolean;
  onLocate: () => void;
  onRecenter: () => void;
  onFitRoute: () => void;
}) {
  void fix;
  return (
    <div className="absolute right-3 top-1/2 z-[500] flex -translate-y-1/2 flex-col gap-2">
      <ControlButton
        label={tracking ? 'Stop live location' : 'Show my location (GPS)'}
        onClick={onLocate}
        primary={tracking}
      >
        <LocateFixed className="h-5 w-5" aria-hidden="true" />
      </ControlButton>
      <ControlButton label="Recenter on my position" onClick={onRecenter}>
        <Crosshair className="h-5 w-5" aria-hidden="true" />
      </ControlButton>
      {hasRoute ? (
        <ControlButton label="Fit route on screen" onClick={onFitRoute}>
          <Maximize className="h-5 w-5" aria-hidden="true" />
        </ControlButton>
      ) : null}
    </div>
  );
});

export function StartNavFab({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-[48px] items-center gap-2 rounded-control bg-ink-deep px-6 py-3 text-sm font-bold text-white shadow hover:bg-black focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark"
    >
      <Navigation className="h-4 w-4" aria-hidden="true" />
      Start navigation
    </button>
  );
}
