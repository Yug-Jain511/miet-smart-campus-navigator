import { useMemo, useState } from 'react';
import { Ban, CheckCircle2, Download, FlaskConical, QrCode, RotateCcw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ImportTab } from '../../components/admin/ImportTab';
import { LiveRouteDebug } from '../../components/admin/LiveRouteDebug';
import { CampusMap } from '../../components/map/CampusMap';
import { QRGenerator } from '../../components/qr/QRGenerator';
import { Button } from '../../components/ui/Button';
import { DEMO_DATA_NOTICE } from '../../data/demoCampus';
import type { CampusLocation } from '../../models/types';
import { isFirebaseConfigured } from '../../services/firebase/config';
import { clearPublishedDataset } from '../../services/firebase/campusStore';
import { computeMapScale } from '../../services/positioning/snap';
import { findRoute } from '../../services/routing/routeService';
import { formatDistance } from '../../services/routing/walkingTime';

type Tab = 'overview' | 'locations' | 'graph' | 'import' | 'qr' | 'settings';

export function AdminPage() {
  const { campus, journey } = useApp();
  const [tab, setTab] = useState<Tab>('overview');
  const [qrLocationId, setQrLocationId] = useState<string>('MAIN_GATE');
  const [demoFrom, setDemoFrom] = useState<string>('MAIN_GATE');
  const [demoTo, setDemoTo] = useState<string>('LIBRARY');
  // Map-editor foundation (session-only preview until published via Import).
  const [placeMode, setPlaceMode] = useState(false);
  const [draftPoint, setDraftPoint] = useState<{ x: number; y: number } | null>(null);
  const [connectFrom, setConnectFrom] = useState('');
  const [connectTo, setConnectTo] = useState('');

  const qrLocation: CampusLocation | undefined = campus.locations.find(
    (l) => l.id === qrLocationId,
  );

  // Dijkstra demo: live recalculation against current (possibly blocked/edited) graph.
  const demoRoute = useMemo(() => {
    const from = campus.graph.nodes.find((n) => n.locationId === demoFrom)?.id;
    const to = campus.graph.nodes.find((n) => n.locationId === demoTo)?.id;
    if (!from || !to) return null;
    return findRoute(from, to, campus.graph);
  }, [demoFrom, demoTo, campus.graph]);

  const tabs: Array<[Tab, string]> = [
    ['overview', 'Overview'],
    ['locations', 'Locations'],
    ['graph', 'Graph + Map editor'],
    ['import', 'Import Data'],
    ['qr', 'QR codes'],
    ['settings', 'Settings'],
  ];

  function exportSessionGraph() {
    const payload = JSON.stringify(
      { nodes: campus.graph.nodes, edges: campus.graph.edges },
      null,
      2,
    );
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
    a.download = 'campus-graph-session.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  function addDraftNode() {
    if (!draftPoint) return;
    const n = campus.graph.nodes.length + 1;
    campus.addNode({
      id: `NODE_CUSTOM_${n}`,
      x: Math.round(draftPoint.x),
      y: Math.round(draftPoint.y),
      label: `Custom point ${n} (session preview)`,
    });
    setDraftPoint(null);
    setPlaceMode(false);
  }

  function addDraftEdge() {
    if (!connectFrom || !connectTo || connectFrom === connectTo) return;
    const a = campus.graph.nodes.find((x) => x.id === connectFrom);
    const b = campus.graph.nodes.find((x) => x.id === connectTo);
    if (!a || !b) return;
    const meters = Math.max(
      1,
      Math.round(Math.hypot((b.x ?? 0) - (a.x ?? 0), (b.y ?? 0) - (a.y ?? 0)) * computeMapScale(campus.graph)),
    );
    campus.addEdge({
      id: `EDGE_CUSTOM_${campus.graph.edges.length + 1}`,
      from: connectFrom,
      to: connectTo,
      distanceMeters: meters,
      accessible: true,
      blocked: false,
    });
    setConnectFrom('');
    setConnectTo('');
  }

  return (
    <div className="relative">
      <div>
        <p className="font-mono text-[11px] font-bold tracking-[0.14em] text-brand-ink">
          CAMPUS CONTROL
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-[-0.01em] text-ink-deep">
          Admin
        </h1>
        <p className="mt-1 font-mono text-[11px] tracking-wide text-ink-soft">
          {DEMO_DATA_NOTICE} · SOURCE: {campus.datasetInfo.source.toUpperCase()}
        </p>
      </div>

      <div role="tablist" aria-label="Admin sections" className="mt-4 flex flex-wrap gap-x-5 gap-y-1 border-b border-ink-deep/10">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`relative pb-2 font-mono text-[11px] font-bold tracking-[0.12em] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark ${
              tab === id ? 'text-ink-deep' : 'text-ink-soft hover:text-ink-deep'
            }`}
          >
            {label.toUpperCase()}
            <span
              aria-hidden="true"
              className={`absolute inset-x-0 -bottom-px h-[2px] bg-brand transition-transform duration-200 ${
                tab === id ? 'scale-x-100' : 'scale-x-0'
              }`}
            />
          </button>
        ))}
      </div>

      <div className="pt-4">
      {tab === 'overview' ? (
        <dl className="grid gap-px border border-ink-deep/10 bg-ink-deep/10 sm:grid-cols-4">
          {[
            ['LOCATIONS', campus.counts.locations],
            ['NODES', campus.counts.nodes],
            ['EDGES', campus.counts.edges],
            ['QR CODES', campus.counts.qrCodes],
          ].map(([label, value]) => (
            <div key={label as string} className="bg-white px-4 py-3">
              <dd className="font-mono text-2xl font-bold tabular-nums text-ink-deep">{value}</dd>
              <dt className="mt-0.5 font-mono text-[10px] font-bold tracking-[0.14em] text-ink-soft">{label}</dt>
            </div>
          ))}
        </dl>
      ) : null}

      {tab === 'locations' ? (
        <div>
          <h2 className="font-mono text-[11px] font-bold tracking-[0.12em] text-ink-soft">
            LOCATIONS · {campus.datasetInfo.source.toUpperCase()}
          </h2>
          <ul className="mt-1 divide-y divide-ink-deep/10 border-y border-ink-deep/10">
            {campus.locations.map((l) => (
              <li key={l.id} className="flex flex-wrap items-baseline gap-x-3 py-2.5 text-sm">
                <span className="font-bold text-ink-deep">{l.name}</span>
                <span className="font-mono text-[11px] text-ink-soft">{l.id}</span>
                <span className="ml-auto font-mono text-[11px] text-ink-soft">
                  {l.category.toUpperCase()} · ({l.mapX}, {l.mapY})
                </span>
                {l.description ? (
                  <span className="basis-full text-[13px] text-ink-soft">{l.description}</span>
                ) : null}
              </li>
            ))}
          </ul>
          <p className="mt-2 font-mono text-[11px] text-ink-soft">ADD LOCKED IN DEMO — USE IMPORT DATA FOR DATASET CHANGES.</p>
        </div>
      ) : null}

      {tab === 'import' ? <ImportTab /> : null}

      {tab === 'settings' ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="font-mono text-[11px] font-bold tracking-[0.12em] text-ink-soft">DATASET</h2>
            <dl className="mt-2 divide-y divide-ink-deep/10 border-y border-ink-deep/10 text-sm">
              {[
                ['Source', campus.datasetInfo.source],
                ['Version', campus.datasetInfo.version],
                ['Campus', campus.datasetInfo.campusName],
                ['Map', campus.datasetInfo.mapType],
                ['Snap threshold', `${campus.settings.maxSnapMeters} m`],
                ['Off-route threshold', `${campus.settings.offRouteMeters} m`],
                ['Firebase', isFirebaseConfigured() ? 'configured' : 'not configured (local data)'],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-2 py-1.5">
                  <dt className="font-semibold text-ink-deep">{k}</dt>
                  <dd className="ml-auto font-mono text-xs text-ink-soft">{v}</dd>
                </div>
              ))}
            </dl>
            {!campus.datasetInfo.isDemo ? (
              <Button
                type="button"
                variant="secondary"
                className="mt-3"
                onClick={() => {
                  clearPublishedDataset();
                  window.location.reload();
                }}
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" /> Reset to bundled demo
              </Button>
            ) : null}
          </div>
          <div>
            <h2 className="font-mono text-[11px] font-bold tracking-[0.12em] text-ink-soft">SESSION GRAPH</h2>
            <p className="mt-2 text-[13px] text-ink-soft">
              Export in-session graph edits (distances, blocks, placed nodes) for re-import via Import Data.
            </p>
            <Button type="button" variant="secondary" className="mt-3" onClick={exportSessionGraph}>
              <Download className="h-4 w-4" aria-hidden="true" /> Export session graph JSON
            </Button>
          </div>
        </div>
      ) : null}

      {tab === 'graph' ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="flex items-center gap-2 font-mono text-[11px] font-bold tracking-[0.12em] text-ink-soft">
              <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
              NAVIGATION GRAPH · ADMIN ONLY
            </h2>
            <ul className="mt-2 divide-y divide-ink-deep/10 border-y border-ink-deep/10">
              {campus.graph.edges.map((e) => (
                <li key={e.id} className="py-2.5 text-sm">
                  <p className="font-mono text-xs font-bold text-ink-deep">{e.id}</p>
                  <p className="font-mono text-[11px] text-ink-soft">{e.from} ↔ {e.to}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-1.5 font-mono text-[11px] text-ink-soft">
                      DIST (M)
                      <input
                        type="number"
                        min={1}
                        value={e.distanceMeters}
                        onChange={(ev) => campus.updateEdgeDistance(e.id, Number(ev.target.value))}
                        className="w-20 rounded-control border border-ink-deep/20 bg-white px-2 py-1 font-mono text-xs"
                        aria-label={`Distance for ${e.id}`}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => campus.toggleEdgeBlocked(e.id)}
                      aria-pressed={!!e.blocked}
                      className={`inline-flex items-center gap-1.5 rounded-control border px-2.5 py-1 font-mono text-[11px] font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark ${
                        e.blocked
                          ? 'border-red-700/30 bg-red-50 text-red-800'
                          : 'border-green-800/25 bg-green-50 text-green-800'
                      }`}
                    >
                      {e.blocked ? <Ban className="h-3 w-3" aria-hidden="true" /> : <CheckCircle2 className="h-3 w-3" aria-hidden="true" />}
                      {e.blocked ? 'BLOCKED' : 'OPEN'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <Button type="button" variant="ghost" onClick={campus.resetGraph} className="mt-2 px-0">
              <RotateCcw className="h-4 w-4" aria-hidden="true" /> Reset demo graph
            </Button>
          </div>

          <div>
            <h2 className="font-mono text-[11px] font-bold tracking-[0.12em] text-ink-soft">DIJKSTRA DEMO</h2>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="font-mono text-[11px] font-bold text-ink-soft">FROM
                <select value={demoFrom} onChange={(e) => setDemoFrom(e.target.value)} className="mt-1 w-full rounded-control border border-ink-deep/20 bg-white px-2 py-2 text-sm font-normal text-ink-deep">
                  {campus.locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </label>
              <label className="font-mono text-[11px] font-bold text-ink-soft">TO
                <select value={demoTo} onChange={(e) => setDemoTo(e.target.value)} className="mt-1 w-full rounded-control border border-ink-deep/20 bg-white px-2 py-2 text-sm font-normal text-ink-deep">
                  {campus.locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </label>
            </div>
            <div className="mt-2 border-y border-ink-deep/10 py-2.5 text-sm" aria-live="polite">
              {demoRoute ? (
                <>
                  <p><strong>Path:</strong> <span className="font-mono text-xs">{demoRoute.nodeIds.join(' → ')}</span></p>
                  <p className="mt-1"><strong>Distance:</strong> {formatDistance(demoRoute.totalDistanceMeters)}</p>
                  <button
                    type="button"
                    onClick={() => {
                      if (demoFrom) journey.requestRoute(demoFrom, demoTo);
                    }}
                    className="mt-2 font-mono text-[11px] font-bold tracking-wider text-brand-ink hover:underline"
                  >
                    OPEN IN NAVIGATE →
                  </button>
                </>
              ) : (
                <p><strong>No route.</strong> All paths are blocked — unblock an edge to restore routing.</p>
              )}
            </div>
            <LiveRouteDebug />
          </div>
        </div>
      ) : null}

      {tab === 'graph' ? (
        <div className="mt-6 border-t border-ink-deep/10 pt-4">
          <h2 className="font-mono text-[11px] font-bold tracking-[0.12em] text-ink-soft">MAP EDITOR · SESSION PREVIEW</h2>
          <p className="mt-1 text-[13px] text-ink-soft">
            Tap the map to place a node, then connect nodes. Permanence via Import Data → export session graph.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              type="button"
              variant={placeMode ? 'primary' : 'secondary'}
              onClick={() => setPlaceMode((v) => !v)}
              aria-pressed={placeMode}
            >
              {placeMode ? 'Cancel placing' : 'Place node on map'}
            </Button>
            {draftPoint ? (
              <Button type="button" onClick={addDraftNode}>
                Add node at ({Math.round(draftPoint.x)}, {Math.round(draftPoint.y)})
              </Button>
            ) : null}
          </div>
          <div className="mt-3">
            <CampusMap
              locations={campus.locations}
              graph={campus.graph}
              features={campus.features}
              heightClass="h-[320px]"
              mapTapEnabled={placeMode}
              onMapTap={(x, y) => setDraftPoint({ x, y })}
              showDemoBadge={false}
            />
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <label className="font-mono text-[11px] font-bold text-ink-soft">FROM NODE
              <select value={connectFrom} onChange={(e) => setConnectFrom(e.target.value)} className="mt-1 w-full rounded-control border border-ink-deep/20 bg-white px-2 py-2 text-sm font-normal">
                <option value="">Select…</option>
                {campus.graph.nodes.map((n) => <option key={n.id} value={n.id}>{n.id}</option>)}
              </select>
            </label>
            <label className="font-mono text-[11px] font-bold text-ink-soft">TO NODE
              <select value={connectTo} onChange={(e) => setConnectTo(e.target.value)} className="mt-1 w-full rounded-control border border-ink-deep/20 bg-white px-2 py-2 text-sm font-normal">
                <option value="">Select…</option>
                {campus.graph.nodes.map((n) => <option key={n.id} value={n.id}>{n.id}</option>)}
              </select>
            </label>
            <Button type="button" variant="secondary" onClick={addDraftEdge}>
              Connect
            </Button>
          </div>
        </div>
      ) : null}

      {tab === 'qr' ? (
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div>
            <h2 className="flex items-center gap-2 font-mono text-[11px] font-bold tracking-[0.12em] text-ink-soft">
              <QrCode className="h-3.5 w-3.5" aria-hidden="true" />
              LOCATION QR
            </h2>
            <label className="mt-2 block font-mono text-[11px] font-bold text-ink-soft">LOCATION
              <select
                value={qrLocationId}
                onChange={(e) => setQrLocationId(e.target.value)}
                className="mt-1 w-full rounded-control border border-ink-deep/20 bg-white px-2 py-2.5 text-sm font-normal text-ink-deep"
              >
                {campus.locations.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </label>
            <ul className="mt-2 divide-y divide-ink-deep/10 border-y border-ink-deep/10">
              {campus.qrCodes.map((q) => (
                <li key={q.id}>
                  <button
                    type="button"
                    onClick={() => setQrLocationId(q.locationId)}
                    aria-current={q.locationId === qrLocationId}
                    className={`flex w-full items-center gap-2 py-2 text-left font-mono text-xs ${
                      q.locationId === qrLocationId ? 'font-bold text-brand-ink' : 'text-ink-soft hover:text-ink-deep'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 ${q.locationId === qrLocationId ? 'bg-brand' : 'bg-ink-deep/20'}`} aria-hidden="true" />
                    {q.label}
                    <Download className="ml-auto h-3 w-3" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
          {qrLocation ? <QRGenerator location={qrLocation} /> : null}
        </div>
      ) : null}
      </div>
    </div>
  );
}
