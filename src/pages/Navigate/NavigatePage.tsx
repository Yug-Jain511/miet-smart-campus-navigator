import L from 'leaflet';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, Hand, Navigation } from 'lucide-react';
import { formatDistance, formatWalkingTime } from '../../services/routing/walkingTime';
import { useApp } from '../../context/AppContext';
import { GpxRouteMap } from '../../components/map/GpxRouteMap';
import { MapControls } from '../../components/map/MapControls';
import { PositionBadge } from '../../components/map/PositionBadge';
import { DestinationSearch } from '../../components/navigation/DestinationSearch';
import { DirectionsList } from '../../components/navigation/DirectionsList';
import { YouAreHereBanner } from '../../components/navigation/YouAreHereBanner';
import { QRScannerEntry } from '../../components/qr/QRScannerEntry';
import { Button } from '../../components/ui/Button';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { useGpxRoute } from '../../hooks/useGpxRoute';
import { logRouteDebug } from '../../services/routing/routeDebug';
import {
  isOffTrack,
  remainingOnTrack,
} from '../../services/navigation/geoNavigation';
import { demoFallbackOrigin, pickKnownOrigin } from '../../services/positioning/originResolver';
import { gpxSourcesFor } from '../../services/routes/routeRegistry';

/**
 * Full-screen GPX navigation experience. Destination-first: the origin
 * resolves automatically (QR > session > live fix > GPS attempt > labeled
 * MAIN_GATE demo fallback), the registered real track renders blue,
 * and live tracking snaps to that same surveyed geometry.
 */
export function NavigatePage() {
  const { campus, journey, position } = useApp();
  const [params, setParams] = useSearchParams();
  const [toDraft, setToDraft] = useState<string | null>(journey.destinationId);
  const [qrError, setQrError] = useState<string | null>(null);
  const [tapMode, setTapMode] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locateFailed, setLocateFailed] = useState(false);
  const [demoOrigin, setDemoOrigin] = useState<string | null>(null);
  const [geoActive, setGeoActive] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const failedFor = useRef<string | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  const names = useMemo(
    () => new Map(campus.locations.map((l) => [l.id, l.name])),
    [campus.locations],
  );
  const coords = useMemo(
    () =>
      new Map(
        campus.locations.map((l) => [l.id, { lat: l.latitude ?? 0, lng: l.longitude ?? 0 }]),
      ),
    [campus.locations],
  );
  const nameOf = (id: string | null) => (id ? (names.get(id) ?? id) : '—');
  const validIds = useMemo(() => campus.locations.map((l) => l.id), [campus.locations]);

  const pickDestination = useCallback(
    (id: string | null) => {
      setGeoActive(false);
      position.stopTracking();
      setToDraft(id);
    },
    [position],
  );

  // Keep draft in sync when deep link / route state sets the destination.
  useEffect(() => {
    setToDraft(journey.destinationId);
  }, [journey.destinationId]);

  // Reset transient state when the destination changes.
  useEffect(() => {
    failedFor.current = null;
    setLocateFailed(false);
    setLocating(false);
    setDemoOrigin(null);
    setShowDirections(false);
  }, [toDraft]);

  // Reset transient state when the destination changes.
  useEffect(() => {
    failedFor.current = null;
    setLocateFailed(false);
    setLocating(false);
    setDemoOrigin(null);
    setShowDirections(false);
  }, [toDraft]);

  // Deep link: /navigate?destination=LIBRARY (from Home / Explore cards).
  useEffect(() => {
    const dest = params.get('destination');
    if (dest && names.has(dest.toUpperCase())) {
      setToDraft(dest.toUpperCase());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Destination-first auto flow — origin resolves itself, route follows.
  useEffect(() => {
    if (!toDraft || geoActive) return;
    if (journey.currentLocationId && journey.destinationId === toDraft) return;
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

  // Settle the GPS attempt: snapped fix → route; demo fallback → MAIN_GATE.
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

  // A real location arriving later (QR scan, manual tap) replaces the demo origin.
  useEffect(() => {
    if (!toDraft || geoActive || !demoOrigin) return;
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

  const originId = journey.currentLocationId;
  const destId = journey.destinationId ?? toDraft;
  const samePlace = !!originId && !!destId && originId === destId;

  const {
    status: gpxStatus,
    route: gpxRoute,
    error: gpxError,
    reload: reloadGpx,
  } = useGpxRoute(
    originId && destId && !samePlace ? originId : null,
    originId && destId && !samePlace ? destId : null,
    nameOf(originId),
    nameOf(destId),
  );

  const originLoc = originId ? campus.locations.find((l) => l.id === originId) : undefined;
  const destLoc = destId ? campus.locations.find((l) => l.id === destId) : undefined;

  // Live geo navigation state (snapped to the surveyed track only).
  const geoInfo = useMemo(() => {
    if (!geoActive || !gpxRoute || gpxRoute.points.length < 2) return null;
    const fix = position.fix;
    if (fix.latitude === undefined || fix.longitude === undefined) return null;
    const pos = { lat: fix.latitude, lng: fix.longitude };
    const off = isOffTrack(pos, gpxRoute.points, campus.settings.offRouteMeters);
    const remaining = remainingOnTrack(pos, gpxRoute.points, nameOf(destId));
    const walked = gpxRoute.distanceMeters - remaining.remainingMeters;
    const nextStep = gpxRoute.steps.find((s) => s.atMeters > walked + 1) ?? null;
    return { off, remaining, nextStep };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geoActive, gpxRoute, position.fix, destId, campus.settings.offRouteMeters]);

  function clearQrParams() {
    const next = new URLSearchParams(params);
    next.delete('location');
    setParams(next, { replace: true });
  }

  const handleMapTap = useCallback(
    (lat: number, lng: number) => {
      setDemoOrigin(null);
      const f = position.applyManualGeo(lat, lng);
      if (f.locationId && f.confidence !== 'low' && toDraft) {
        journey.requestRoute(f.locationId, toDraft);
      }
      setTapMode(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [position, toDraft],
  );

  function fitGpx() {
    const map = mapRef.current;
    const pts = gpxRoute?.points ?? [];
    if (!map || pts.length === 0) return;
    map.flyToBounds(
      L.latLngBounds(pts.map((p) => [p.lat, p.lng] as [number, number])).pad(0.2),
      { duration: 0.6 },
    );
  }

  function recenter() {
    const map = mapRef.current;
    if (!map) return;
    const f = position.fix;
    if (f.latitude !== undefined && f.longitude !== undefined) {
      map.flyTo([f.latitude, f.longitude], 17, { duration: 0.6 });
    } else if (originId) {
      const c = coords.get(originId);
      if (c) map.flyTo([c.lat, c.lng], 17, { duration: 0.6 });
    }
  }

  function startNavigation() {
    if (!gpxRoute) return;
    setGeoActive(true);
    position.startTracking();
  }

  function exitNavigation() {
    setGeoActive(false);
    position.stopTracking();
  }

  // Dev diagnostics for the GPX pipeline.
  useEffect(() => {
    if (!destId || gpxStatus === 'idle' || gpxStatus === 'loading') return;
    logRouteDebug({
      sourceLocation: originId,
      sourceNode: originId,
      destinationLocation: destId,
      destinationNode: destId,
      nodeIds: gpxRoute ? gpxRoute.points.map((_, i) => `trkpt:${i}`) : null,
      routeCoords: null,
      distanceMeters: gpxRoute ? gpxRoute.distanceMeters : null,
      etaSeconds: gpxRoute ? gpxRoute.etaSeconds : null,
      routeError: gpxStatus === 'error' ? (gpxError ?? 'GPX load failed') : null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gpxStatus]);

  const qrLocationName = journey.qrLocationId ? nameOf(journey.qrLocationId) : null;

  return (
    <div className="relative flex h-[100dvh] flex-col overflow-hidden">
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

      {!toDraft && !destId ? (
        /* Idle: destination picker (map appears once a destination is set) */
        <div className="flex flex-1 flex-col bg-paper px-4 pb-8 pt-20">
          <p className="font-mono text-[11px] font-bold tracking-[0.14em] text-brand-ink">
            MIET · SMART CAMPUS NAVIGATOR
          </p>
          <h1 className="mt-2 text-[28px] font-extrabold leading-tight tracking-[-0.02em] text-ink-deep">
            Where do you want to go?
          </h1>
          <div className="mt-4">
            <DestinationSearch
              onPick={(loc) => pickDestination(loc.id)}
              compact
              locations={campus.locations}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5" role="list" aria-label="Quick destinations">
            {campus.locations
              .filter((l) => l.type !== 'entrance')
              .map((l) => (
                <button
                  key={l.id}
                  type="button"
                  role="listitem"
                  onClick={() => pickDestination(l.id)}
                  className="rounded-control border border-ink-deep/15 bg-white px-4 py-2.5 font-mono text-xs font-bold tracking-wider text-ink-deep transition-colors duration-150 hover:border-brand/50 hover:text-brand-ink"
                >
                  {l.name.toUpperCase()}
                </button>
              ))}
          </div>
          {journey.recent.length > 0 ? (
            <div className="mt-4 flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-[11px] font-bold tracking-[0.12em] text-ink-soft">RECENT</span>
              {journey.recent.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => pickDestination(id)}
                  className="rounded-control px-2 py-1 font-mono text-[11px] text-ink-soft hover:bg-white hover:text-ink-deep"
                >
                  {nameOf(id)}
                </button>
              ))}
            </div>
          ) : null}
          {qrError ? (
            <div className="mt-4">
              <ErrorBanner message={qrError} />
            </div>
          ) : null}
        </div>
      ) : (
        /* Full-screen route view */
        <div className="relative min-h-0 flex-1">
          {gpxRoute && originLoc && destLoc ? (
            <GpxRouteMap
              points={gpxRoute.points}
              origin={{
                position: { lat: originLoc.latitude ?? 0, lng: originLoc.longitude ?? 0 },
                label: originLoc.name,
                sub: 'Start',
              }}
              destination={{
                position: { lat: destLoc.latitude ?? 0, lng: destLoc.longitude ?? 0 },
                label: destLoc.name,
                sub: destLoc.category,
              }}
              userFix={position.fix.source === 'unknown' ? null : position.fix}
              mapRef={mapRef}
              heightClass="h-full"
              mapTapEnabled={tapMode}
              onMapTap={handleMapTap}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-paper px-6 text-center">
              {gpxStatus === 'error' ? (
                <div className="max-w-sm space-y-3">
                  <ErrorBanner message={gpxError ?? 'The walking route could not be loaded.'} />
                  <div className="flex justify-center gap-2">
                    <Button type="button" variant="secondary" onClick={() => void reloadGpx()}>
                      Try again
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => pickDestination(null)}>
                      New search
                    </Button>
                  </div>
                </div>
              ) : (
                <p role="status" className="font-mono text-xs tracking-[0.12em] text-ink-soft">
                  {locating ? 'FINDING YOUR LOCATION…' : 'LOADING WALKING ROUTE…'}
                </p>
              )}
            </div>
          )}

          {/* Floating search */}
          <div className="absolute left-2.5 right-2.5 top-[4.25rem] z-[500] sm:left-auto sm:w-[360px] sm:right-16">
            <div className="rounded-control bg-white/95 p-1.5 shadow ring-1 ring-ink-deep/10 backdrop-blur">
              <DestinationSearch
                onPick={(loc) => pickDestination(loc.id)}
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

          {/* Status strips */}
          <div className="absolute left-2.5 right-2.5 top-[8.25rem] z-[500] space-y-2 sm:left-auto sm:w-[360px] sm:right-16">
            {qrError ? <ErrorBanner message={qrError} /> : null}
            {position.gpsError ? <ErrorBanner message={position.gpsError} /> : null}
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
              <p role="status" className="border border-amber-700/25 bg-amber-50/95 px-3 py-2 text-[13px] font-semibold text-amber-900">
                Demo starting location · Main Gate
              </p>
            ) : null}
            <PositionBadge fix={position.fix} />
          </div>

          {gpxRoute ? (
            <MapControls
              fix={position.fix}
              hasRoute
              tracking={position.tracking}
              onLocate={() => void position.locateOnce()}
              onRecenter={recenter}
              onFitRoute={fitGpx}
            />
          ) : null}

          {/* Bottom sheet */}
          <section
            aria-live="polite"
            aria-label="Route results"
            className="absolute inset-x-2.5 bottom-2.5 z-[500] sm:left-3 sm:right-auto sm:w-[380px] sm:bottom-3"
          >
            {geoActive && gpxRoute ? (
              <div className="rounded-control bg-white/95 p-3 shadow ring-1 ring-ink-deep/10 backdrop-blur">
                {geoInfo?.off ? (
                  <ErrorBanner message="You appear to be off route." />
                ) : geoInfo ? (
                  <p className="flex items-center gap-2.5 text-[15px] font-bold text-ink-deep">
                    <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center bg-brand text-base text-white">→</span>
                    {geoInfo.nextStep ? geoInfo.nextStep.text : geoInfo.remaining.nextInstruction}
                  </p>
                ) : (
                  <p className="text-sm text-ink-soft">Waiting for your live position…</p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {geoInfo ? (
                    <p className="font-mono text-xs tracking-wide text-ink-soft">
                      <strong className="text-ink-deep">{nameOf(destId).toUpperCase()}</strong> ·{' '}
                      {formatDistance(geoInfo.remaining.remainingMeters)} ·{' '}
                      {formatWalkingTime(
                        geoInfo.remaining.remainingMeters / 1.4,
                      )}{' '}
                      LEFT
                    </p>
                  ) : null}
                  <span className="ml-auto flex gap-2">
                    {geoInfo?.off ? (
                      <Button type="button" onClick={fitGpx}>
                        Recalculate
                      </Button>
                    ) : null}
                    <Button type="button" variant="secondary" onClick={exitNavigation}>
                      Exit
                    </Button>
                  </span>
                </div>
              </div>
            ) : gpxRoute && originLoc && destLoc ? (
              <div className="rounded-control bg-white/95 p-3 shadow ring-1 ring-ink-deep/10 backdrop-blur">
                <p className="font-mono text-[11px] font-bold tracking-[0.12em] text-ink-soft">
                  {originLoc.name.toUpperCase()} → {destLoc.name.toUpperCase()}
                </p>
                <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-ink-deep">
                  {formatDistance(gpxRoute.distanceMeters)}
                  <span className="ml-2 align-middle font-sans text-[13px] font-semibold text-ink-soft">
                    {formatWalkingTime(gpxRoute.etaSeconds)} walk
                  </span>
                </p>
                <p className="mt-1 font-mono text-[10px] tracking-[0.08em] text-ink-soft">
                  REAL GPS TRACK · WALKED &amp; RECORDED ON CAMPUS
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <Button type="button" onClick={startNavigation} className="flex-1">
                    <Navigation className="h-4 w-4" aria-hidden="true" />
                    Start Navigation
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setShowDirections((v) => !v)} aria-expanded={showDirections}>
                    Directions
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${showDirections ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                  </Button>
                </div>
                {showDirections ? (
                  <div className="mt-2 max-h-44 overflow-y-auto border-t border-ink-deep/10 pt-1">
                    <DirectionsList directions={gpxRoute.steps.map((s) => s.text)} />
                  </div>
                ) : null}
              </div>
            ) : samePlace ? (
              <div className="rounded-control bg-white/95 p-3 shadow ring-1 ring-ink-deep/10 backdrop-blur">
                <p className="text-sm font-bold text-ink-deep">You are already at this location.</p>
                <Button type="button" variant="secondary" onClick={() => pickDestination(null)} className="mt-2">
                  New search
                </Button>
              </div>
            ) : (
              <div className="rounded-control bg-white/95 p-3 shadow ring-1 ring-ink-deep/10 backdrop-blur">
                {originId && destId && !gpxSourcesFor(originId, destId) ? (
                  <p className="text-sm font-bold text-ink-deep">
                    No walking route is available between these locations.
                  </p>
                ) : locateFailed ? (
                  <>
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
                    <p className="mt-2 text-xs text-ink-soft">
                      Or scan a location QR code with your camera — it opens navigation with that spot confirmed.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-mono text-[11px] font-bold tracking-[0.12em] text-ink-soft">
                      {locating ? 'FINDING YOUR LOCATION…' : 'WHERE TO?'}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5" role="list" aria-label="Quick destinations">
                      {campus.locations
                        .filter((l) => l.type !== 'entrance')
                        .map((l) => (
                          <button
                            key={l.id}
                            type="button"
                            role="listitem"
                            onClick={() => pickDestination(l.id)}
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
                    {journey.recent.length > 0 ? (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-[11px] font-bold tracking-[0.12em] text-ink-soft">RECENT</span>
                        {journey.recent.map((id) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => pickDestination(id)}
                            className="rounded-control px-2 py-1 font-mono text-[11px] text-ink-soft hover:bg-white hover:text-ink-deep"
                          >
                            {nameOf(id)}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
