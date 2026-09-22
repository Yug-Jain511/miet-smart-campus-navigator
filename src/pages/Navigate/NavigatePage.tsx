import L from 'leaflet';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Hand, Navigation } from 'lucide-react';
import { formatDistance, formatWalkingTime } from '../../services/routing/walkingTime';
import { useApp } from '../../context/AppContext';
import { CampusMap } from '../../components/map/CampusMap';
import { MapControls } from '../../components/map/MapControls';
import { PositionBadge } from '../../components/map/PositionBadge';
import { toLatLng, routeToLatLngs } from '../../components/map/mapUtils';
import { logRouteDebug } from '../../services/routing/routeDebug';
import { demoFallbackOrigin, pickKnownOrigin } from '../../services/positioning/originResolver';
import { DestinationSearch } from '../../components/navigation/DestinationSearch';
import { DirectionsList } from '../../components/navigation/DirectionsList';
import { RouteSummary } from '../../components/navigation/RouteSummary';
import { YouAreHereBanner } from '../../components/navigation/YouAreHereBanner';
import { QRScannerEntry } from '../../components/qr/QRScannerEntry';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorBanner } from '../../components/ui/ErrorBanner';

export function NavigatePage() {
  const { campus, journey, position, navigation } = useApp();
  const [params, setParams] = useSearchParams();
  const [toDraft, setToDraft] = useState<string | null>(journey.destinationId);
  const [qrError, setQrError] = useState<string | null>(null);
  const [tapMode, setTapMode] = useState(false);
  // Auto location resolution state (destination-first flow).
  const [locating, setLocating] = useState(false);
  const [locateFailed, setLocateFailed] = useState(false);
  // DEMO fallback origin (demo dataset only, GPS unavailable). Kept separate
  // from position.fix so GPS honesty is never compromised.
  const [demoOrigin, setDemoOrigin] = useState<string | null>(null);
  const failedFor = useRef<string | null>(null);
  const fittedRouteKey = useRef<string | null>(null);
  const loggedRouteKey = useRef<string | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Dataset-driven name lookup (no hardcoded location table).
  const names = useMemo(
    () => new Map(campus.locations.map((l) => [l.id, l.name])),
    [campus.locations],
  );
  const nameOf = (id: string | null) => (id ? (names.get(id) ?? id) : '—');
  const validIds = useMemo(() => campus.locations.map((l) => l.id), [campus.locations]);

  // Keep draft in sync when deep link / route state sets the destination.
  useEffect(() => {
    setToDraft(journey.destinationId);
  }, [journey.destinationId]);

  // Reset recovery state when the destination changes.
  useEffect(() => {
    failedFor.current = null;
    fittedRouteKey.current = null;
    loggedRouteKey.current = null;
    setLocateFailed(false);
    setLocating(false);
    setDemoOrigin(null);
  }, [toDraft]);

  // Deep link: /navigate?destination=LIBRARY (from Home / Explore cards).
  useEffect(() => {
    const dest = params.get('destination');
    if (dest && names.has(dest.toUpperCase())) {
      setToDraft(dest.toUpperCase());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Destination-first auto flow: once a destination is set, resolve the
  // origin automatically — QR > session > live fix > one GPS attempt.
  // No "Where are you?" form. Route calculates itself when origin is known.
  useEffect(() => {
    if (!toDraft || navigation.active) return;
    if (journey.route && journey.destinationId === toDraft) return;
    const known = pickKnownOrigin(
      journey.qrLocationId,
      journey.currentLocationId,
      {
        locationId: position.fix.locationId ?? null,
        confident: position.fix.confidence !== 'low',
      },
    );
    if (known) {
      setLocating(false);
      setLocateFailed(false);
      journey.requestRoute(known, toDraft);
      return;
    }
    if (failedFor.current === toDraft || locating) return;
    setLocating(true);
    setLocateFailed(false);
    void position.locateOnce();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  });

  // Settle the GPS attempt: snapped fix → route; demo fallback (demo
  // dataset only) → MAIN_GATE with an explicit demo badge; otherwise recovery.
  useEffect(() => {
    if (!locating || !toDraft) return;
    if (position.fix.source === 'unknown' && !position.gpsError) return; // still waiting
    const loc =
      position.fix.locationId && position.fix.confidence !== 'low'
        ? position.fix.locationId
        : null;
    if (loc) {
      setLocating(false);
      journey.requestRoute(loc, toDraft);
      return;
    }
    // DEMO fallback (demo dataset only): MAIN_GATE stands in so the demo
    // route works without geolocation. Published datasets show recovery UI.
    const fallback = demoFallbackOrigin(campus.datasetInfo.isDemo);
    if (fallback) {
      setLocating(false);
      setDemoOrigin(fallback);
      journey.requestRoute(fallback, toDraft);
      return;
    }
    setLocating(false);
    setLocateFailed(true);
    failedFor.current = toDraft;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locating, toDraft, position.fix, position.gpsError]);

  // Feed live fixes into the navigation session (remaining + off-route).
  useEffect(() => {
    if (navigation.active) navigation.updateFix(position.fix);
  }, [navigation, position.fix]);

  // A real location arriving later (QR scan, manual tap) replaces the demo origin.
  useEffect(() => {
    if (!toDraft || navigation.active || !demoOrigin) return;
    const real =
      journey.qrLocationId ??
      (position.fix.locationId && position.fix.confidence !== 'low'
        ? position.fix.locationId
        : null);
    if (real && real !== demoOrigin) {
      setDemoOrigin(null);
      journey.requestRoute(real, toDraft);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  });

  const committedFromName = nameOf(journey.currentLocationId);
  const committedToName = nameOf(journey.destinationId);
  const qrLocationName = journey.qrLocationId ? nameOf(journey.qrLocationId) : null;

  // Active session route wins over the preview route.
  const displayedRoute =
    navigation.active && navigation.sessionRoute ? navigation.sessionRoute : journey.route;
  const routeNodeIds = useMemo(
    () => (displayedRoute ? displayedRoute.nodeIds : []),
    [displayedRoute],
  );
  const routePoints = useMemo(
    () => routeToLatLngs(routeNodeIds, campus.graph.nodes),
    [routeNodeIds, campus.graph],
  );

  function clearQrParams() {
    const next = new URLSearchParams(params);
    next.delete('location');
    setParams(next, { replace: true });
  }

  // Stable tap handler so the map doesn't re-render on every GPS tick.
  const handleMapTap = useCallback(
    (x: number, y: number) => {
      setDemoOrigin(null);
      position.applyManual(x, y, campus.settings.maxSnapMeters);
      setTapMode(false);
    },
    [position, campus.settings.maxSnapMeters],
  );

  function recenter() {
    const map = mapRef.current;
    if (!map) return;
    const f = position.fix;
    if (f.mapX !== undefined && f.mapY !== undefined) {
      map.flyTo(toLatLng(f.mapX, f.mapY) as L.LatLngExpression, 1.5, { duration: 0.6 });
    } else if (journey.currentLocationId) {
      const loc = campus.locations.find((l) => l.id === journey.currentLocationId);
      if (loc) map.flyTo(toLatLng(loc.mapX, loc.mapY) as L.LatLngExpression, 1, { duration: 0.6 });
    } else {
      map.flyToBounds(
        [
          [0, 0],
          [1000, 1000],
        ],
        { duration: 0.6 },
      );
    }
  }

  function fitRoute() {
    const map = mapRef.current;
    if (!map || routePoints.length === 0) return;
    map.flyToBounds(L.latLngBounds(routePoints as L.LatLngExpression[]).pad(0.25), {
      duration: 0.6,
    });
  }

  // Auto-fit each new preview route so a computed route is always visible.
  useEffect(() => {
    if (navigation.active || !displayedRoute || displayedRoute.nodeIds.length < 2) return;
    const key = displayedRoute.nodeIds.join('>');
    if (fittedRouteKey.current === key) return;
    fittedRouteKey.current = key;
    fitRoute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  });

  // Dev diagnostics: log the full chain once per route outcome.
  useEffect(() => {
    if (!toDraft || navigation.active || displayedRoute === undefined) return;
    const key = `dest=${toDraft}|route=${displayedRoute ? displayedRoute.nodeIds.join('>') : 'null'}`;
    if (loggedRouteKey.current === key) return;
    loggedRouteKey.current = key;
    const nodeByLoc = new Map(
      campus.graph.nodes.map((n) => [n.locationId ?? '', n.id]),
    );
    const srcLoc = journey.currentLocationId;
    const dstLoc = journey.destinationId;
    logRouteDebug({
      sourceLocation: srcLoc,
      sourceNode: srcLoc ? (nodeByLoc.get(srcLoc) ?? null) : null,
      destinationLocation: dstLoc,
      destinationNode: dstLoc ? (nodeByLoc.get(dstLoc) ?? null) : null,
      nodeIds: displayedRoute ? displayedRoute.nodeIds : null,
      routeCoords: displayedRoute ? routeToLatLngs(displayedRoute.nodeIds, campus.graph.nodes) : null,
      distanceMeters: displayedRoute ? displayedRoute.totalDistanceMeters : null,
      etaSeconds: displayedRoute ? displayedRoute.estimatedWalkingTimeSeconds : null,
      routeError: displayedRoute ? null : 'findRoute returned null (no path)',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  });

  const hasRoute = !!displayedRoute && displayedRoute.nodeIds.length > 1;

  function startNavigation() {
    if (!hasRoute || !displayedRoute) return;
    navigation.start(displayedRoute);
    position.startTracking();
  }

  function exitNavigation() {
    navigation.stop();
    position.stopTracking();
  }

  return (
    <div className="space-y-3">
      {/* QR entry: ?location=MAIN_GATE auto-sets current location */}
      <QRScannerEntry
        validIds={validIds}
        onValid={(id) => {
          setQrError(null);
          setDemoOrigin(null);
          journey.applyQrLocation(id);
          position.applyQr(id);
        }}
        onInvalid={(raw) => {
          journey.applyQrLocation(null);
          setQrError(`This QR code does not correspond to a valid campus location. (Got “${raw}”)`);
        }}
      />

      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-xl font-extrabold tracking-[-0.01em] text-ink-deep">Navigate</h1>
        <PositionBadge fix={position.fix} />
      </div>

      {qrError ? <ErrorBanner message={qrError} /> : null}
      {position.gpsError ? <ErrorBanner message={position.gpsError} /> : null}
      {position.fix.note && position.fix.source !== 'unknown' && position.fix.confidence === 'low' ? (
        <ErrorBanner message={position.fix.note} tone="warn" />
      ) : null}
      {qrLocationName ? (
        <YouAreHereBanner
          locationName={qrLocationName}
          onClear={() => {
            journey.applyQrLocation(null);
            position.clear();
            clearQrParams();
          }}
        />
      ) : null}
      {demoOrigin && !journey.qrLocationId ? (
        <p role="status" className="border border-amber-700/25 bg-amber-50 px-3 py-2 text-[13px] font-semibold text-amber-900">
          Demo location: Main Gate — GPS unavailable, showing the demo route.
        </p>
      ) : null}

      {/* HERO MAP with floating search + controls */}
      <div className="relative">
        <CampusMap
          locations={campus.locations}
          graph={campus.graph}
          features={campus.features}
          routeNodeIds={routeNodeIds}
          currentLocationId={journey.currentLocationId}
          destinationId={journey.destinationId}
          positionFix={position.fix.source === 'unknown' ? null : position.fix}
          mapTapEnabled={tapMode}
          onMapTap={handleMapTap}
          mapRef={mapRef}
          heightClass="h-[62vh] min-h-[380px] lg:h-[68vh]"
          showDemoBadge={campus.datasetInfo.isDemo}
        />

        {/* Floating search */}
        <div className="absolute left-2.5 right-16 top-2.5 z-[500] sm:right-auto sm:w-[360px]">
          <div className="rounded-control bg-white/95 p-1.5 shadow ring-1 ring-ink-deep/10 backdrop-blur">
            <DestinationSearch
              onPick={(loc) => setToDraft(loc.id)}
              compact
              locations={campus.locations}
            />
          </div>
          {tapMode ? (
            <p className="mt-2 inline-block bg-ink-deep/90 px-2.5 py-1 font-mono text-[11px] font-bold tracking-wide text-white">
              TAP MAP TO SET POSITION…
            </p>
          ) : null}
        </div>

        <MapControls
          fix={position.fix}
          hasRoute={hasRoute}
          tracking={position.tracking}
          onLocate={() => void position.locateOnce()}
          onRecenter={recenter}
          onFitRoute={fitRoute}
        />
      </div>

      {/* BOTTOM SHEET */}
      <section aria-live="polite" aria-label="Route results">
        {navigation.active && navigation.sessionRoute ? (
          <div className="border-y-2 border-ink-deep py-3">
            {navigation.offRoute ? (
              <ErrorBanner message="You appear to be off route." />
            ) : navigation.info ? (
              <p className="flex items-center gap-2.5 text-[15px] font-bold text-ink-deep">
                <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center bg-brand text-base text-white">→</span>
                {navigation.info.nextInstruction}
              </p>
            ) : (
              <p className="text-sm text-ink-soft">Waiting for your live position…</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {navigation.info ? (
                <p className="font-mono text-xs tracking-wide text-ink-soft">
                  <strong className="text-ink-deep">{committedToName.toUpperCase()}</strong> ·{' '}
                  {formatDistance(navigation.info.remainingMeters)} ·{' '}
                  {formatWalkingTime(navigation.info.remainingSeconds)} LEFT
                </p>
              ) : null}
              <span className="ml-auto flex gap-2">
                {navigation.offRoute && position.fix.nodeId ? (
                  <Button
                    type="button"
                    onClick={() => navigation.recalculate(position.fix)}
                  >
                    Recalculate
                  </Button>
                ) : null}
                <Button type="button" variant="secondary" onClick={exitNavigation}>
                  Exit
                </Button>
              </span>
            </div>
            {!position.fix.nodeId ? (
              <p className="mt-2 text-xs text-ink-soft">
                Live position unavailable — recalculation needs a snapped position (QR, GPS near a path, or tap-to-set).
              </p>
            ) : null}
          </div>
        ) : displayedRoute === undefined ? (
          <div className="border-t border-ink-deep/10 pt-3">
            <p className="font-mono text-[11px] font-bold tracking-[0.12em] text-ink-soft">
              {locating ? 'FINDING YOUR LOCATION…' : 'WHERE TO?'}
            </p>
            {/* Quick destinations from campus data (entrances are origins, not goals) */}
            <div className="mt-2 flex flex-wrap gap-1.5" role="list" aria-label="Quick destinations">
              {campus.locations
                .filter((l) => l.type !== 'entrance')
                .map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    role="listitem"
                    onClick={() => setToDraft(l.id)}
                    aria-pressed={toDraft === l.id}
                    className={`rounded-control border px-3 py-1.5 font-mono text-[11px] font-bold tracking-wider transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark ${
                      toDraft === l.id
                        ? 'border-brand bg-brand text-white'
                        : 'border-ink-deep/15 bg-white text-ink-soft hover:border-brand/50 hover:text-brand-ink'
                    }`}
                  >
                    {l.name.toUpperCase()}
                  </button>
                ))}
            </div>
            {locating ? (
              <p className="mt-3 text-[13px] text-ink-soft" role="status">
                Finding your location… route calculates automatically once you&apos;re located.
              </p>
            ) : null}
            {locateFailed && toDraft ? (
              <div className="mt-3 border border-ink-deep/10 bg-white p-3">
                <p className="text-sm font-bold text-ink-deep">Couldn&apos;t determine your location.</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      failedFor.current = null;
                      setLocateFailed(false);
                      setLocating(true);
                      void position.locateOnce();
                    }}
                  >
                    Try GPS again
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
                </div>
                {tapMode ? (
                  <p className="mt-2 text-xs text-ink-soft">Tap anywhere on the map to set your position.</p>
                ) : (
                  <p className="mt-2 text-xs text-ink-soft">
                    Or scan a location QR code with your camera — it opens navigation with that spot confirmed.
                  </p>
                )}
              </div>
            ) : null}
            {journey.recent.length > 0 ? (
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-[11px] font-bold tracking-[0.12em] text-ink-soft">RECENT</span>
                {journey.recent.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setToDraft(id)}
                    className="rounded-control px-2 py-1 font-mono text-[11px] text-ink-soft hover:bg-white hover:text-ink-deep"
                  >
                    {nameOf(id)}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : displayedRoute === null ? (
          <div className="border-t border-ink-deep/10 pt-3">
            <ErrorBanner message="No walking route is available between these locations." />
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                failedFor.current = null;
                setLocateFailed(false);
                if (journey.currentLocationId && toDraft) {
                  journey.requestRoute(journey.currentLocationId, toDraft);
                }
              }}
              className="mt-3"
            >
              Try again
            </Button>
          </div>
        ) : displayedRoute.nodeIds.length <= 1 ? (
          <EmptyState title="You are already at this location." />
        ) : (
          <div className="grid gap-4 border-t border-ink-deep/10 pt-3 lg:grid-cols-[300px_minmax(0,1fr)]">
            <div className="space-y-3">
              <RouteSummary
                route={displayedRoute}
                fromName={committedFromName}
                toName={committedToName}
              />
              <p className="font-mono text-[10px] tracking-[0.08em] text-ink-soft">
                DEMO ROUTE — WALKING PATH WILL BE UPDATED AFTER CAMPUS SURVEY
              </p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={startNavigation}>
                  <Navigation className="h-4 w-4" aria-hidden="true" />
                  Start navigation
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => journey.setDestinationId(null)}
                >
                  New search
                </Button>
              </div>
              <Button type="button" variant="ghost" onClick={fitRoute} className="px-0">
                Fit route on map →
              </Button>
            </div>
            <div className="lg:border-l lg:border-ink-deep/10 lg:pl-4">
              <h2 className="font-mono text-[11px] font-bold tracking-[0.12em] text-ink-soft">DIRECTIONS</h2>
              <DirectionsList directions={displayedRoute.directions} />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
