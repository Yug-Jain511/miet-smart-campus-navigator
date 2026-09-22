import type { RouteResult } from '../../models/types';
import { formatDistance, formatWalkingTime } from '../../services/routing/walkingTime';

// Route ledger: mono figures, red rule, no card chrome.
export function RouteSummary({
  route,
  fromName,
  toName,
}: {
  route: RouteResult;
  fromName: string;
  toName: string;
}) {
  return (
    <div className="border-l-2 border-brand pl-3">
      <p className="font-mono text-[11px] font-bold tracking-[0.12em] text-ink-soft">
        {fromName.toUpperCase()} → {toName.toUpperCase()}
      </p>
      <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-ink-deep">
        {formatDistance(route.totalDistanceMeters)}
        <span className="ml-2 align-middle font-sans text-[13px] font-semibold text-ink-soft">
          {formatWalkingTime(route.estimatedWalkingTimeSeconds)} walk
        </span>
      </p>
    </div>
  );
}
