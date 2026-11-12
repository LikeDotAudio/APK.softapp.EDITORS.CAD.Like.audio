// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/**
 * A PROJECT'S DEVICES, AS BIM HOLDS THEM (ROAD-3577) — what the 🧱 Blocks palette reads and writes.
 *
 * DATABASE.server.BIM bim/projects.py: a project is an IfcProject (the bench is project `bench`,
 * #1), each device an OCCURRENCE of its part's type with its own GlobalId, and an assignment says
 * which drawing sheet it is placed on. READS come from the library app (:8160, or the gateway's
 * /library/ and /api/bim) — GET /api/bim/projects[/<id>?drawing=] — and its socket pushes
 * {"type": "projects"} on every change. WRITES go through the gateway to BIM's own 8150 (the bench
 * credential): PUT /api/bim/projects/<id>/assignments/<instance> {drawing, sheet, placement},
 * DELETE …?drawing=, and the device-list import PUT /api/bim/projects/<id>. An occurrence's OWN ports
 * (a connector dropped on it — flow/dropConnector.ts) are written to
 * PUT /api/bim/projects/<id>/instances/<instance>/ports {ports, port_connectors} (ROAD-3688).
 *
 * WHERE THE WRITES GO: localStorage `cad.bimApi`, else `bim=` in the address hash, else this
 * origin's /api/bim (the gateway; Storage-Portal :8080 refuses the write and the palette says so).
 */
import type { BimOccurrence, BimRef, BlockPlacement, Port } from '../core/types';
import type { BimPart } from '../flow/bimPart';

export interface ProjectRow {
  id: string; name: string; make?: string; model?: string; location?: string; category?: string;
  part: string | null; unresolved?: string;
  bim?: BimPart; ref?: BimRef;
  occurrence: BimOccurrence;
  assigned: { drawing: string; sheet: string; placement?: string; at?: string } | null;
}
export interface ProjectView {
  id: string; name: string; builtin: boolean; total: number; placed: number; available: number; unresolved: number;
  here?: number; drawing?: string; globalId?: string;
  by_category: Record<string, { placed: number; available: number; here: number }>;
  instances: ProjectRow[];
}
export interface ProjectListing { items: Array<Pick<ProjectView, 'id' | 'name' | 'total' | 'placed' | 'available' | 'unresolved' | 'builtin'>> }

/** The sheet of this drawing a placement lands on: the active viewport's name, else Model. */
export function currentSheet(store: { activeViewportId: string; viewports: Array<{ id: string; name: string }> }): string {
  if (store.activeViewportId === 'ALL') return 'Model';
  return store.viewports.find((v) => v.id === store.activeViewportId)?.name ?? store.activeViewportId;
}

/** What BIM calls this drawing: its file name. An untitled drawing tracks nothing (it has no name to be on). */
export function drawingName(store: { currentFileName: string | null }): string | null {
  return store.currentFileName?.trim() || null;
}

export function bimWriteBase(): string {
  let saved = '';
  try { saved = localStorage.getItem('cad.bimApi') ?? ''; } catch { /* private window */ }
  const fromHash = /[?&]bim=([^&]+)/.exec(window.location.hash)?.[1];
  const base = saved || (fromHash ? decodeURIComponent(fromHash) : `${window.location.origin}/api/bim`);
  return base.replace(/\/$/, '');
}

/** The library app's /api/bim and its socket, from the app's address (BimLibraryTab bimLibraryUrl). */
export function libraryEndpoints(appUrl: string): { api: string; socket: string } {
  const u = new URL(appUrl);
  const ws = `${u.protocol === 'https:' ? 'wss' : 'ws'}://${u.host}${u.pathname.replace(/\/library\/?.*$/, '')}/library/ws`;
  return { api: `${u.origin}/api/bim`, socket: ws };
}

/** Every BIM occurrence placed on this drawing, by GlobalId. */
export function occurrencesOn(placements: readonly BlockPlacement[]): Map<string, BlockPlacement> {
  const out = new Map<string, BlockPlacement>();
  for (const p of placements) if (p.occurrence?.globalId) out.set(p.occurrence.globalId, p);
  return out;
}

/** What moved between two looks at one drawing: occurrences placed, and occurrences removed. */
export function diffOccurrences(before: ReadonlyMap<string, BlockPlacement>, now: ReadonlyMap<string, BlockPlacement>):
  { placed: BlockPlacement[]; removed: BlockPlacement[] } {
  return {
    placed: [...now].filter(([g]) => !before.has(g)).map(([, p]) => p),
    removed: [...before].filter(([g]) => !now.has(g)).map(([, p]) => p),
  };
}

/** The drag payload of a palette row: the part as the CAD draws it, its ref, and — for an instance — its occurrence. */
export function dragPayload(row: { bim?: BimPart; ref?: BimRef; occurrence?: BimOccurrence }): string {
  return JSON.stringify({ bim: row.bim, ref: row.ref, ...(row.occurrence ? { occurrence: row.occurrence } : {}) });
}

async function answer<T>(res: Response, what: string): Promise<T> {
  const body = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (res.status === 401) throw new Error(`${what}: the gateway wants the bench credential for a BIM write`);
  if (!res.ok) throw new Error(`${what}: ${body.error ?? res.status}`);
  return body;
}

export async function listProjects(api: string, f: typeof fetch = fetch): Promise<ProjectListing> {
  return answer(await f(`${api}/projects`, { cache: 'no-store' }), 'projects');
}

export async function readProject(api: string, id: string, drawing: string | null, f: typeof fetch = fetch): Promise<ProjectView> {
  const q = drawing ? `?drawing=${encodeURIComponent(drawing)}` : '';
  return answer(await f(`${api}/projects/${encodeURIComponent(id)}${q}`, { cache: 'no-store' }), `project ${id}`);
}

export async function assign(base: string, occ: BimOccurrence, drawing: string, placement: number, f: typeof fetch = fetch): Promise<unknown> {
  return answer(await f(`${base}/projects/${encodeURIComponent(occ.project)}/assignments/${encodeURIComponent(occ.instance)}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ drawing, sheet: occ.sheet ?? 'Model', placement: String(placement) }),
  }), `place ${occ.instance}`);
}

export async function free(base: string, occ: BimOccurrence, drawing: string, f: typeof fetch = fetch): Promise<unknown> {
  return answer(await f(`${base}/projects/${encodeURIComponent(occ.project)}/assignments/${encodeURIComponent(occ.instance)}?drawing=${encodeURIComponent(drawing)}`,
    { method: 'DELETE' }), `free ${occ.instance}`);
}

/** The device-list import: a .json ({name, devices} or [rows]) or a .csv (make, model, name, location[, part, id]). */
export function importBody(fileName: string, text: string, name: string): Record<string, unknown> {
  if (/\.csv$/i.test(fileName)) return { name, source: fileName, csv: text };
  const v = JSON.parse(text) as unknown;
  if (Array.isArray(v)) return { name, source: fileName, devices: v };
  return { name, source: fileName, ...(v as Record<string, unknown>) };
}

export async function importProject(base: string, id: string, body: Record<string, unknown>, f: typeof fetch = fetch): Promise<ProjectView> {
  return answer(await f(`${base}/projects/${encodeURIComponent(id)}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  }), `import ${id}`);
}

/** ONE instance's own ports (ROAD-3688): what connectors dropped on it gave it, never its part type. */
export interface InstancePorts { ports: Port[]; port_connectors: Record<string, string> }

/** A placement's own ports as BIM's instance-ports record holds them. */
export function instancePortsOf(p: BlockPlacement): InstancePorts {
  return { ports: p.ports ?? [], port_connectors: p.portConnectors ?? {} };
}

/**
 * Which occurrences' own ports to write, by GlobalId: on a drawing just opened (`before` null) every
 * occurrence that HAS own ports (one with none says nothing new); after, every one whose own ports
 * changed — back to none included, which clears BIM's record. An occurrence taken off the drawing is
 * not written: what was fitted to the device stays with it.
 */
export function portWrites(before: ReadonlyMap<string, string> | null, now: readonly BlockPlacement[]):
  { writes: Array<{ occ: BimOccurrence; body: InstancePorts }>; seen: Map<string, string> } {
  const seen = new Map<string, string>();
  const writes: Array<{ occ: BimOccurrence; body: InstancePorts }> = [];
  for (const p of now) {
    if (!p.occurrence?.globalId) continue;
    const body = instancePortsOf(p);
    const sig = JSON.stringify(body);
    seen.set(p.occurrence.globalId, sig);
    const was = before?.get(p.occurrence.globalId);
    const empty = !body.ports.length && !Object.keys(body.port_connectors).length;
    if (was === undefined ? !empty : was !== sig) writes.push({ occ: p.occurrence, body });
  }
  return { writes, seen };
}

export async function putInstancePorts(base: string, occ: BimOccurrence, body: InstancePorts, f: typeof fetch = fetch): Promise<unknown> {
  return answer(await f(`${base}/projects/${encodeURIComponent(occ.project)}/instances/${encodeURIComponent(occ.instance)}/ports`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  }), `ports of ${occ.instance}`);
}

/**
 * Keep BIM's record of each placed occurrence's own ports equal to the drawing's (ROAD-3688): watches
 * the store (debounced), writes what portWrites says through the gateway. A drawing with no name
 * tracks nothing, like the assignments. Returns the unsubscribe.
 */
export function installInstancePortsSync(store: {
  subscribe(fn: () => void): () => void; currentFileName: string | null;
  schematic: { placements: BlockPlacement[] }; showHint(text: string, ms?: number): void;
}, f: typeof fetch = fetch, delayMs = 400, writeBase: () => string = bimWriteBase): () => void {
  let drawing: string | null = null;
  let seen: Map<string, string> | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let lastError = '';
  const run = () => {
    const name = drawingName(store);
    if (!name) { drawing = null; seen = null; return; }
    const { writes, seen: next } = portWrites(drawing === name ? seen : null, store.schematic.placements);
    drawing = name; seen = next;
    if (!writes.length) return;
    const base = writeBase();
    for (const w of writes) void putInstancePorts(base, w.occ, w.body, f).then(() => { lastError = ''; }).catch((e: Error) => {
      if (e.message !== lastError) store.showHint(e.message, 5000);
      lastError = e.message;
    });
  };
  const off = store.subscribe(() => { clearTimeout(timer); timer = setTimeout(run, delayMs); });
  run();
  return () => { clearTimeout(timer); off(); };
}
