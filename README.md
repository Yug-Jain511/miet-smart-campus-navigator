# MIET Smart Campus Navigator

> Google Maps gets you to MIET. MIET Smart Campus Navigator helps you find your way once you're inside MIET.

A web-based campus walking-navigation MVP for MIET (Meerut Institute of Engineering & Technology).
Student scans a QR at the Main Gate → app sets **Current Location = Main Gate** → student picks
**Library** or **Admin Block** → app calculates the shortest walking route with Dijkstra, draws it on a
campus-specific map, and shows distance, walking time and step-by-step directions.

## DEMO DATA — Replace with actual MIET survey data

All coordinates (`mapX/mapY` on a 0–1000 `CRS.Simple` plane), distances, pathways and graph
relationships are **fictional placeholders**. No real MIET geography is claimed.
Demo data lives in one place: `src/data/demoCampus/` (`locations.ts`, `nodes.ts`, `edges.ts`, `aliases.ts`).

## Features

### Implemented (Phase 2)

- Map-hero Navigate page: floating search, full-height campus map, bottom-sheet
  (Where to? → quick chips → route preview → Start navigation → live mode)
- Positioning abstraction (`src/services/positioning/`): QR confirmed / GPS
  estimated with real accuracy / manual tap-to-set / indoor stub (future)
- GPS honesty: one-shot locate + live tracking, accuracy shown, poor-accuracy
  warnings, no fake indoor precision
- Segment-first snapping: GPS/manual positions snap to the nearest valid path
  only within a configurable threshold (default 25 m); far positions stay raw
  with low confidence + manual/QR fallback
- Map calibration model: full affine needs ≥3 non-collinear points; 2 points
  give an explicit similarity transform; anything less is "insufficient"
- Live navigation mode: remaining distance/time, next instruction, real
  geometric off-route detection, Recalculate from the new position
- Canonical operator dataset (`src/data/campus/campus.json`, schema v1):
  map, locations, nodes, edges, QR, features, calibration, settings
- Admin Import workflow: Upload → Validate → Preview → Publish (CSV/JSON,
  templates, validation report, versioned publish, rollback to demo)
- Admin map editor foundation: tap-to-place nodes, connect nodes, edit/block
  edges, export session graph JSON
- QR upgrades: copy link, PNG/SVG download, printable sheet with MIET logo
- Route weights ready: distance + accessibility penalty + blocked (congestion
  reserved at 0); single route in UI
- MIET branding: official logo in header, Home, QR cards, favicon
- 49-test suite (routing, weights, search, QR, calibration, snapping, GPS
  resolution, off-route, recalculation, validation, import, walking time)

### Earlier MVP (preserved)

- Campus map (Leaflet + React-Leaflet, custom `CRS.Simple` campus visuals: buildings, pathways, lawns)
- Destination search (case-insensitive, partial, basic fuzzy: `lib` → Library)
- AI-ready `findDestinationFromQuery()` (`"where is the library?"` → LIBRARY) — keyword matching, NOT ML
- Location selectors (current + destination) + recent destinations
- Own routing engine: **Dijkstra** (`src/services/routing/`), independent of UI so A\* can be added later
- Distance + ETA (`1.4 m/s` walking speed, `src/services/routing/walkingTime.ts`)
- Plain-language directions (no fake left/right turns)
- QR location flow (`/navigate?location=MAIN_GATE`) + prominent "You are here" banner
- Admin/Debug: counts, locations view, graph viewer, edge distance edit, block/unblock, Dijkstra demo, QR generator + SVG download
- Mobile-first Navigate page (controls → map → bottom route card)
- Friendly errors: no destination / already here / no route / invalid QR
- Vitest suite for routing (8 tests)

### Future (not implemented)

- 360° panorama navigation (`PanoramaPoint` type exists, kept separate — no pipeline)
- Voice navigation, crowd prediction, ML route optimization
- Indoor floor navigation, full-campus expansion

## Installation

```bash
npm install
npm run dev
```

Open http://localhost:5173.

No `.env` or Firebase needed — the app runs fully on local demo data.

## Environment variables (optional)

Copy `.env.example` to `.env` only when you have Firebase:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_APP_BASE_URL=https://your-domain.vercel.app
```

`src/services/firebase/config.ts` is guarded: missing keys → `getDb()` returns `null`, app keeps using demo data.

## Firebase setup (later)

1. Create a Firebase project, enable Firestore.
2. Fill `.env` (see above).
3. Collections (see `firestore.rules`): `locations`, `navigationNodes`, `navigationEdges`, `qrCodes`, `settings`.
4. Public read, admin-only write (custom claim `admin: true`). Never put admin credentials in frontend code.

## Demo data & replacing it (no code changes)

1. Admin → **Import Data**: upload `campus.json` (or locations/nodes/edges CSVs
   + calibration JSON) using the downloadable templates.
2. **Validate**: fix ✕ errors; confirm ⚠ warnings. Affine GPS calibration needs
   3+ non-collinear points; 2 points give similarity-only mapping.
3. **Preview** the staged map, then **Publish**. Map, locations, graph, search,
   QR, calibration and navigation update at once (versioned, with rollback).
4. Developers: the canonical shape is `src/data/campus/schema.ts`; the bundled
   demo is `src/data/campus/campus.json` (same 3 fictional locations).

Legacy seed tables remain under `src/data/demoCampus/` for unit tests.

## Routing explanation (beginner-friendly)

Think of walkable points as **nodes** and paths as **edges** with a **weight = distance in meters**.
Dijkstra's algorithm:

1. Start at the source node with distance 0, all others ∞.
2. Repeatedly visit the unvisited node with the smallest known distance.
3. For each path from it, if going through it is shorter, update that neighbor's distance and remember "came from here".
4. When every reachable node is visited, walk the "came from" chain backwards from the destination → shortest path.

`findRoute()` in `routeService.ts` wraps this, sums distance, computes `time = distance / 1.4`,
and builds directions. UI calls `findRoute()` — never Dijkstra directly.

## QR explanation

A QR encodes only a URL with a location id, e.g.:

```
https://your-app-domain.com/navigate?location=MAIN_GATE
```

`QRScannerEntry` reads `?location=`, validates against known locations, and sets current location.
Admin → QR tab generates/downloads one QR per location (`react-qr-code`).

## Future panorama architecture

`PanoramaPoint { id, locationId, imageUrl?, heading?, connectedPoints? }` links a future 360° photo
to a `locationId` / node id. Routing stays independent; a future viewer would step through
`route.nodeIds → panoramaAt(node) → forward arrow → next panorama`.

## Demo script

1. Open `/`, see campus map. 2. Open `/admin` → QR → download Main Gate QR (or just visit `/navigate?location=MAIN_GATE`).
3. See **You are here: Main Gate**. 4. Search `lib` → pick Library → Find Route.
5. See blue route, `180 m`, `~2 min`, directions. 6. Repeat for Admin Block.
7. Admin → Graph demo → block `EDGE_LIBRARY_ADMIN` → Library→Admin reroutes via Gate (400 m).

## Scripts

- `npm run dev` — local dev
- `npm test` — routing tests (vitest)
- `npm run build` — typecheck + production build

## Deploy

- **Vercel (default):** import repo, `npm run build`, output `dist/`. `vercel.json` rewrites all routes to `index.html` so QR deep links work.
- **Firebase Hosting (alt):** `npm run build`, then serve `dist/` via `firebase.json` hosting config.
