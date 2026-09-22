// Data-operator import: Upload → Validate → Preview → Publish.
// A normal campus-data update NEVER touches React/TS source.
// Drafts stay staged until Publish; errors block, warnings need confirm.

import { useMemo, useState } from 'react';
import { CheckCircle2, Download, OctagonX, TriangleAlert, Upload } from 'lucide-react';
import { CampusMap } from '../map/CampusMap';
import { useApp } from '../../context/AppContext';
import { getBundledDataset } from '../../data/campus/loader';
import { publishDataset } from '../../services/firebase/campusStore';
import type { CampusDataset } from '../../data/campus/schema';
import {
  IMPORT_TEMPLATES,
  parseEdgesCsv,
  parseLocationsCsv,
  parseNodesCsv,
} from '../../data/campus/importer';
import { validateCampusDataset } from '../../data/campus/validator';
import { Button } from '../ui/Button';
import { ErrorBanner } from '../ui/ErrorBanner';

function readText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result ?? ''));
    r.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    r.readAsText(file);
  });
}

function downloadText(filename: string, text: string, type = 'text/plain') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export function ImportTab() {
  const { campus } = useApp();
  const [draft, setDraft] = useState<CampusDataset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warningsOk, setWarningsOk] = useState(false);
  const [published, setPublished] = useState(false);

  const report = useMemo(() => (draft ? validateCampusDataset(draft) : null), [draft]);

  async function loadFullJson(file: File) {
    setError(null);
    setPublished(false);
    try {
      const parsed: unknown = JSON.parse(await readText(file));
      setDraft(parsed as CampusDataset);
      setWarningsOk(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON file.');
    }
  }

  async function mergeParts(kind: 'locations' | 'nodes' | 'edges' | 'calibration', file: File) {
    setError(null);
    setPublished(false);
    try {
      const text = await readText(file);
      const base = draft ?? getBundledDataset();
      if (kind === 'locations') base.locations = parseLocationsCsv(text);
      if (kind === 'nodes') base.nodes = parseNodesCsv(text);
      if (kind === 'edges') base.edges = parseEdgesCsv(text);
      if (kind === 'calibration') {
        const parsed: unknown = JSON.parse(text);
        const points = Array.isArray((parsed as { points?: unknown }).points)
          ? (parsed as { points: CampusDataset['calibration']['points'] }).points
          : (parsed as CampusDataset['calibration']['points']);
        if (!Array.isArray(points)) throw new Error('Calibration file must be a points array or {"points": [...]}.');
        base.calibration = { points };
      }
      setDraft({ ...base });
      setWarningsOk(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : `Could not import ${file.name}.`);
    }
  }

  function handlePublish() {
    if (!draft || !report || !report.valid) return;
    if (report.warnings.length > 0 && !warningsOk) return;
    publishDataset({ ...draft, version: draft.version ?? `upload-${Date.now()}` });
    setPublished(true);
    // Published data drives the whole app — reload so every surface re-reads it.
    setTimeout(() => window.location.reload(), 800);
  }

  function Step({
    n,
    title,
    hint,
    accept,
    onFile,
    template,
    templateName,
  }: {
    n: string;
    title: string;
    hint: string;
    accept: string;
    onFile: (f: File) => void;
    template?: string;
    templateName?: string;
  }) {
    return (
      <li className="flex items-baseline gap-3 border-b border-ink-deep/10 py-2.5 text-sm">
        <span aria-hidden="true" className="font-mono text-[11px] font-bold text-brand">0{n}</span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-ink-deep">{title}</p>
          <p className="font-mono text-[11px] text-ink-soft">{hint}</p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-control border border-ink-deep/15 bg-white px-2.5 py-1.5 font-mono text-[11px] font-bold text-ink-deep hover:border-ink-deep/35">
              <Upload className="h-3 w-3" aria-hidden="true" />
              CHOOSE FILE
              <input
                type="file"
                accept={accept}
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void onFile(f);
                  e.target.value = '';
                }}
              />
            </label>
            {template && templateName ? (
              <button
                type="button"
                onClick={() => downloadText(templateName, template, 'text/csv')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 font-mono text-[11px] font-bold text-brand-ink hover:underline"
              >
                <Download className="h-3 w-3" aria-hidden="true" />
                TEMPLATE
              </button>
            ) : null}
          </div>
        </div>
      </li>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <h2 className="font-mono text-[11px] font-bold tracking-[0.12em] text-ink-soft">UPLOAD CAMPUS DATA</h2>
        <p className="mt-1 text-[13px] text-ink-soft">
          Full <code>campus.json</code>, or assemble step by step. Nothing goes live until Publish.
          Active: <strong className="font-mono text-xs">{campus.datasetInfo.source}</strong> ({campus.datasetInfo.version}).
        </p>
        {error ? (
          <div className="mt-2">
            <ErrorBanner message={error} />
          </div>
        ) : null}
        <ol className="mt-1 border-t border-ink-deep/10">
          <Step
            n="1"
            title="Campus map"
            hint="Image overlay ships with campus.json (map.image). Current demo uses the vector plane — keep it until the surveyed map arrives."
            accept=".json"
            onFile={(f) => void loadFullJson(f)}
          />
          <Step
            n="2"
            title="Locations"
            hint="locations.csv → id,name,category,type,mapX,mapY,description"
            accept=".csv"
            onFile={(f) => void mergeParts('locations', f)}
            template={IMPORT_TEMPLATES.locations}
            templateName="locations.csv"
          />
          <Step
            n="3"
            title="Navigation nodes"
            hint="nodes.csv → id,locationId,mapX,mapY,label (junctions/turns/entrances welcome)"
            accept=".csv"
            onFile={(f) => void mergeParts('nodes', f)}
            template={IMPORT_TEMPLATES.nodes}
            templateName="nodes.csv"
          />
          <Step
            n="4"
            title="Edges"
            hint="edges.csv → from,to,distanceMeters,accessible,blocked"
            accept=".csv"
            onFile={(f) => void mergeParts('edges', f)}
            template={IMPORT_TEMPLATES.edges}
            templateName="edges.csv"
          />
          <Step
            n="5"
            title="QR points"
            hint="QR targets ship inside campus.json (qrCodes). Upload a full campus.json to replace them."
            accept=".json"
            onFile={(f) => void loadFullJson(f)}
          />
          <Step
            n="6"
            title="Calibration points"
            hint='JSON array or {"points": [...]} of {lat,lng,mapX,mapY}. 3+ non-collinear for affine.'
            accept=".json"
            onFile={(f) => void mergeParts('calibration', f)}
          />
        </ol>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              downloadText('campus.json', JSON.stringify(getBundledDataset(), null, 2), 'application/json')
            }
            className="inline-flex items-center gap-1.5 rounded-control border border-ink-deep/15 bg-white px-3 py-2 font-mono text-[11px] font-bold text-ink-deep hover:border-ink-deep/35"
          >
            <Download className="h-3 w-3" aria-hidden="true" />
            CURRENT CAMPUS.JSON
          </button>
          {draft ? (
            <button
              type="button"
              onClick={() => {
                setDraft(null);
                setWarningsOk(false);
              }}
              className="px-3 py-2 font-mono text-[11px] font-bold text-ink-soft hover:text-ink-deep"
            >
              DISCARD DRAFT
            </button>
          ) : null}
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="font-mono text-[11px] font-bold tracking-[0.12em] text-ink-soft">VALIDATE</h2>
          {!report ? (
            <p className="mt-2 text-sm text-ink-soft">Upload data to see the validation report.</p>
          ) : (
            <div className="mt-2 space-y-1.5 text-sm" aria-live="polite">
              <p className="font-mono text-xs text-ink-deep">
                ✓ {report.counts.locations} LOC · ✓ {report.counts.nodes} NODES · ✓{' '}
                {report.counts.edges} EDGES · ✓ {report.counts.qrCodes} QR
              </p>
              {report.warnings.map((w, i) => (
                <p key={i} className="flex items-start gap-2 border border-amber-700/20 bg-amber-50 px-2.5 py-2 text-[13px] text-amber-900">
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {w.message}
                </p>
              ))}
              {report.errors.map((e, i) => (
                <p key={i} className="flex items-start gap-2 border border-red-700/20 bg-red-50 px-2.5 py-2 text-[13px] text-red-800">
                  <OctagonX className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {e.message}
                </p>
              ))}
              {report.valid && report.warnings.length === 0 ? (
                <p className="flex items-center gap-2 font-mono text-xs font-bold text-green-800">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  ALL CHECKS PASSED
                </p>
              ) : null}
            </div>
          )}
        </div>

        {draft ? (
          <div>
            <h2 className="font-mono text-[11px] font-bold tracking-[0.12em] text-ink-soft">PREVIEW</h2>
            <div className="mt-2">
              <CampusMap
                locations={draft.locations}
                graph={{ nodes: draft.nodes, edges: draft.edges }}
                features={draft.features}
                heightClass="h-[260px]"
                showDemoBadge={false}
              />
            </div>
          </div>
        ) : null}

        <div>
          <h2 className="font-mono text-[11px] font-bold tracking-[0.12em] text-ink-soft">PUBLISH</h2>
          {!draft || !report ? (
            <p className="mt-2 text-sm text-ink-soft">Nothing staged yet.</p>
          ) : !report.valid ? (
            <p className="mt-2 text-sm font-semibold text-red-800">Fix the errors above before publishing.</p>
          ) : (
            <div className="mt-2 space-y-3">
              {report.warnings.length > 0 ? (
                <label className="flex items-start gap-2 text-sm text-ink-deep">
                  <input
                    type="checkbox"
                    checked={warningsOk}
                    onChange={(e) => setWarningsOk(e.target.checked)}
                    className="mt-1 h-4 w-4 accent-[#B3121A]"
                  />
                  I accept the {report.warnings.length} warning(s) above.
                </label>
              ) : null}
              <Button
                type="button"
                disabled={report.warnings.length > 0 && !warningsOk}
                onClick={handlePublish}
                className="w-full"
              >
                Publish dataset
              </Button>
              {published ? (
                <p className="text-sm font-semibold text-green-800">Published — reloading with the new campus data…</p>
              ) : (
                <p className="text-xs text-ink-soft">
                  Publishing replaces map, locations, graph, search, QR and navigation at once. Reset via Settings.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
