// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { BlockPlacement, Connector, Point, PortRef, PortSide, SchematicModel } from '../core/types';
import { wirePath } from './cables';
import { outlineCorners } from './placement';
import { connectPorts, definitionFor, disconnect, portOf, portsOf, samePort } from './Schematic';
import { snapAt, wireEndPoint } from './onGrid';

/**
 * WIRES AND NETS — THE DRAWING'S CONNECTIONS AS DATA (the owner, 2026-11-11: "it should be
 * pure math and data declaring connections in the drawings"; "copper wire esque thinking ….
 * from and to"; "When a device is connected it should be connected with a NET"; "this net
 * should act like a single line with bends").
 *
 * A WIRE is the drawing's `Connector`: one record, FROM a pin TO a pin, its bends in between
 * (`route`, sheet mm, the ends never stored — they are the pins), its net's name, and its
 * cable when it is one. What you draw, select, move and delete is the wire.
 *
 * A NET is the electrical result, DERIVED: the pins joined by wires (union–find over each
 * wire's two ends, plus a portal that names its far end on this sheet — a fly pair is one
 * wire, so the same net at both its capsules). Its name is the oldest wire's (the lowest id
 * that carries one), so joining two nets keeps the older name; `normaliseNets` writes that
 * name back on every wire so the record a file holds says it too.
 *
 * Geometry is pure math on point lists: a path is [from, …bends, to]; bends move, slide and
 * appear or go, orthogonal runs stay orthogonal. Discovery reads plain line segments and
 * proposes wires. The wirelist (the EDITORS.Wirelist columns) and the netlist are written
 * from the same records, as is IFC (io/ifc/schematicIfc.ts APK_SchematicWire.Net).
 *
 * No DOM, no store, no renderer: the Wire Manager, the select tool, the properties panel,
 * KiCad export and any other tool (Simulation, BIM, Wirelist) call these and redraw.
 */

// ------------------------------------------------------------------ records

/** One end of a wire, as a wirelist says it: device · port · pin · connector. */
export interface WireEnd {
  placementId: number;
  portId: string;
  /** The device's name on the sheet (its refdes), else `#id`. */
  device: string;
  /** The port's caption. */
  port: string;
  /** The pin within the port: its member name in a group, else `1`. */
  pin: string;
  /** The plug at that port (`XLR3-F`, `RJ45` …), `RJ45?` when only guessed, '' when unknown. */
  connector: string;
}

/** A wire as a record: what is saved, exported and shown — From and To are its defining properties. */
export interface WireRecord {
  id: number;
  from: WireEnd;
  to: WireEnd;
  /** Its bends, sheet mm, [x, y] each. */
  bends: [number, number][];
  net: string;
  /** End to end along its bends, mm; null when an end is not on the sheet. */
  length_mm: number | null;
  layer: string;
  fly?: boolean;
  label?: string;
  cable?: Connector['cable'];
}

const pinKey = (r: PortRef) => `${r.placementId}|${r.portId}`;

/** An end of a wire as a record. */
export function wireEnd(model: SchematicModel, ref: PortRef): WireEnd {
  const placement = model.placements.find((p) => p.id === ref.placementId);
  const port = portOf(model, ref);
  const label = placement?.portLabels?.[ref.portId] ?? port?.label ?? ref.portId;
  const connector = port?.connector ? `${port.connector}${port.connectorGuess ? '?' : ''}` : '';
  return {
    placementId: ref.placementId, portId: ref.portId,
    device: (placement?.refdes ?? `#${ref.placementId}`).split(' · ')[0]!,
    port: label, pin: port?.member && port.group ? port.member : '1', connector,
  };
}

/** The wire's path on the sheet, from pin to pin through its bends (its auto route when it has none). */
export function pathOf(model: SchematicModel, c: Connector): Point[] | null {
  return wirePath(model, c, Math.max(0, model.connectors.indexOf(c)));
}

export function wireRecord(model: SchematicModel, c: Connector, netName?: string): WireRecord {
  const path = pathOf(model, c);
  return {
    id: c.id, from: wireEnd(model, c.from), to: wireEnd(model, c.to),
    bends: (c.route ?? []).map((p) => [p.x, p.y]),
    net: netName ?? netOfWire(model, c.id)?.name ?? '',
    length_mm: path ? Math.round(wireLength(path)) : null,
    layer: c.layerId,
    ...(c.fly ? { fly: true } : {}), ...(c.label ? { label: c.label } : {}), ...(c.cable ? { cable: { ...c.cable } } : {}),
  };
}

/** Every wire on the sheet as a record, in id order. */
export function wireRecords(model: SchematicModel): WireRecord[] {
  const byWire = new Map<number, string>();
  for (const n of nets(model)) for (const w of n.wires) byWire.set(w, n.name);
  return [...model.connectors].sort((a, b) => a.id - b.id).map((c) => wireRecord(model, c, byWire.get(c.id) ?? ''));
}

// ------------------------------------------------------------------ nets

export interface Net {
  name: string;
  /** Every pin on the net, in a stable order. */
  pins: PortRef[];
  /** The wires that make it, by id. */
  wires: number[];
  /** Portals on this net that lead to another drawing (a fly pair across sheets): the drawing names. */
  offSheet?: string[];
}

/** A portal's far end on THIS sheet, when it names one (fly.ts resolvePortal's `to` form). */
function portalFar(model: SchematicModel, placement: BlockPlacement, portId: string): PortRef | null {
  const far = placement.portals?.[portId];
  const to = far?.wired ? far.to : undefined;
  if (!to || to.drawing || typeof to.placementId !== 'number' || !to.port) return null;
  return model.placements.some((p) => p.id === to.placementId) ? { placementId: to.placementId, portId: to.port } : null;
}

/**
 * The nets of a sheet: pins joined by wires (and by wired portals that name their far end
 * here). Named by the oldest wire carrying a name, else `N<oldest wire id>`; a name an older
 * net already holds is not taken twice. `extra` joins more wires (KiCad's panel links).
 */
export function nets(model: SchematicModel, extra: readonly Pick<Connector, 'from' | 'to'>[] = []): Net[] {
  const parent = new Map<string, string>();
  const add = (k: string) => { if (!parent.has(k)) parent.set(k, k); };
  const find = (k: string): string => { let r = k; while (parent.get(r) !== r) r = parent.get(r)!; parent.set(k, r); return r; };
  const join = (a: PortRef, b: PortRef) => { add(pinKey(a)); add(pinKey(b)); parent.set(find(pinKey(a)), find(pinKey(b))); };
  const wires = [...model.connectors].sort((a, b) => a.id - b.id);
  for (const c of wires) join(c.from, c.to);
  for (const c of extra) join(c.from, c.to);
  const offSheet = new Map<string, Set<string>>();
  for (const p of model.placements) for (const portId of Object.keys(p.portals ?? {})) {
    const far = portalFar(model, p, portId);
    if (far) join({ placementId: p.id, portId }, far);
    const portal = p.portals![portId]!;
    if (portal.wired && portal.to?.drawing) {   // a fly to another drawing: this net goes on there
      const k = pinKey({ placementId: p.id, portId });
      add(k);
      (offSheet.get(k) ?? offSheet.set(k, new Set()).get(k)!).add(portal.to.drawing);
    }
  }
  const groups = new Map<string, { pins: string[]; wires: Connector[] }>();
  for (const k of parent.keys()) {
    const r = find(k);
    (groups.get(r) ?? groups.set(r, { pins: [], wires: [] }).get(r)!).pins.push(k);
  }
  for (const c of wires) groups.get(find(pinKey(c.from)))!.wires.push(c);
  const all = [...groups.values()].filter((g) => g.wires.length || g.pins.length > 1 || g.pins.some((k) => offSheet.has(k)));
  // the oldest net first: by its oldest wire
  const oldest = (g: { wires: Connector[] }) => (g.wires.length ? g.wires[0]!.id : Number.MAX_SAFE_INTEGER);
  all.sort((a, b) => oldest(a) - oldest(b) || (a.pins[0]! < b.pins[0]! ? -1 : 1));
  const taken = new Set<string>();
  const out: Net[] = [];
  for (const g of all) {
    const named = g.wires.find((c) => c.net)?.net;
    let name = named && !taken.has(named) ? named : g.wires.length ? `N${oldest(g)}` : `N-${g.pins[0]!.replace('|', '-')}`;
    while (taken.has(name)) name = `${name}′`;
    taken.add(name);
    const pins = g.pins.sort().map((k) => ({ placementId: Number(k.slice(0, k.indexOf('|'))), portId: k.slice(k.indexOf('|') + 1) }));
    const off = [...new Set(g.pins.flatMap((k) => [...(offSheet.get(k) ?? [])]))].sort();
    out.push({ name, pins, wires: g.wires.map((c) => c.id), ...(off.length ? { offSheet: off } : {}) });
  }
  return out;
}

export function netOf(model: SchematicModel, ref: PortRef): Net | undefined {
  return nets(model).find((n) => n.pins.some((p) => samePort(p, ref)));
}

export function netOfWire(model: SchematicModel, wireId: number): Net | undefined {
  return nets(model).find((n) => n.wires.includes(wireId));
}

/** Write each net's derived name onto its wires. True when any wire's record changed. */
export function normaliseNets(model: SchematicModel): boolean {
  let changed = false;
  for (const n of nets(model)) for (const id of n.wires) {
    const c = model.connectors.find((w) => w.id === id)!;
    if (c.net !== n.name) { c.net = n.name; changed = true; }
  }
  return changed;
}

/**
 * Wire `from` to `to`: the wire record, on the net its pins were on — joining a pin already
 * on a net extends it, joining two nets merges them under the older name. Null when refused
 * (a pin to itself, a pair already wired, a pin that is not there).
 */
export function connect(model: SchematicModel, from: PortRef, to: PortRef, layerId = '0', bends?: readonly Point[]): Connector | null {
  const c = connectPorts(model, from, to, layerId);
  if (!c) return null;
  if (bends?.length) c.route = bends.map((p) => ({ x: p.x, y: p.y }));
  normaliseNets(model);
  return c;
}

/** Merge net `b` into net `a`'s name … whichever is OLDER keeps its name (the owner's rule). Returns the kept name, or null. */
export function mergeNets(model: SchematicModel, a: string, b: string): string | null {
  const all = nets(model);
  const na = all.find((n) => n.name === a), nb = all.find((n) => n.name === b);
  if (!na || !nb || na === nb) return null;
  const [older, younger] = Math.min(...na.wires) <= Math.min(...nb.wires) ? [na, nb] : [nb, na];
  // two nets join when a wire joins them: from the younger's first pin to the older's
  const made = connectPorts(model, younger.pins[0]!, older.pins[0]!, model.connectors.find((c) => c.id === older.wires[0])?.layerId ?? '0');
  if (!made) return null;
  normaliseNets(model);
  return older.name;
}

/** Rename a net (every wire on it). Refused (false) when another net already has the name. */
export function renameNet(model: SchematicModel, from: string, to: string): boolean {
  const name = to.trim();
  const all = nets(model);
  const net = all.find((n) => n.name === from);
  if (!net || !name || all.some((n) => n !== net && n.name === name)) return false;
  for (const c of model.connectors) if (net.wires.includes(c.id)) c.net = name;
  return true;
}

/** Take a wire away; the net it held together splits, the younger part takes a name of its own. */
export function deleteWire(model: SchematicModel, id: number): boolean {
  if (!disconnect(model, id)) return false;
  normaliseNets(model);
  return true;
}

/** Re-pick one end of a wire (From or To). Refused when it would wire a pin to itself or repeat a pair. */
export function setWireEnd(model: SchematicModel, id: number, which: 'from' | 'to', ref: PortRef): boolean {
  const c = model.connectors.find((w) => w.id === id);
  if (!c || !portOf(model, ref)) return false;
  const other = which === 'from' ? c.to : c.from;
  if (samePort(other, ref)) return false;
  if (model.connectors.some((w) => w !== c && ((samePort(w.from, ref) && samePort(w.to, other)) || (samePort(w.to, ref) && samePort(w.from, other))))) return false;
  c[which] = { ...ref };
  delete c.route;   // its bends were for the old end
  normaliseNets(model);
  return true;
}

// ------------------------------------------------------------------ geometry (pure math)

const EPS = 1e-6;
const horizontal = (a: Point, b: Point) => Math.abs(a.y - b.y) < EPS && Math.abs(a.x - b.x) >= EPS;
const vertical = (a: Point, b: Point) => Math.abs(a.x - b.x) < EPS && Math.abs(a.y - b.y) >= EPS;

/** Length of a path, end to end. */
export function wireLength(path: readonly Point[]): number {
  let n = 0;
  for (let i = 1; i < path.length; i++) n += Math.hypot(path[i]!.x - path[i - 1]!.x, path[i]!.y - path[i - 1]!.y);
  return n;
}

/** Nearest point on segment ab to p, and how far. */
export function nearestOnSegment(p: Point, a: Point, b: Point): { at: Point; d: number; t: number } {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  const t = len2 ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2)) : 0;
  const at = { x: a.x + t * dx, y: a.y + t * dy };
  return { at, d: Math.hypot(p.x - at.x, p.y - at.y), t };
}

/** The segment of a path nearest p (index i joins path[i] → path[i+1]). */
export function nearestSegment(path: readonly Point[], p: Point): { index: number; at: Point; d: number } | null {
  let best: { index: number; at: Point; d: number } | null = null;
  for (let i = 0; i + 1 < path.length; i++) {
    const n = nearestOnSegment(p, path[i]!, path[i + 1]!);
    if (!best || n.d < best.d) best = { index: i, at: n.at, d: n.d };
  }
  return best;
}

/** The bends of a path: everything but its two pins. */
export const bendsOf = (path: readonly Point[]): Point[] => path.slice(1, -1).map((p) => ({ ...p }));

/** A bend added where `at` falls on the path (on its nearest segment). Returns the new bends and the new bend's index. */
export function addBend(path: readonly Point[], at: Point): { bends: Point[]; index: number } {
  const seg = nearestSegment(path, at);
  const bends = bendsOf(path);
  if (!seg) return { bends, index: -1 };
  bends.splice(seg.index, 0, { ...seg.at });
  return { bends, index: seg.index };
}

/** The bends with bend `i` gone. */
export function removeBend(bends: readonly Point[], i: number): Point[] {
  return bends.filter((_, k) => k !== i).map((p) => ({ ...p }));
}

/**
 * Bend `i` moved to `to`. A neighbouring BEND joined to it by a horizontal or vertical run
 * follows, so the run stays horizontal or vertical (the pins never move).
 */
export function moveBend(path: readonly Point[], i: number, to: Point): Point[] {
  const bends = bendsOf(path);
  const at = bends[i];
  if (!at) return bends;
  const prev = path[i]!, next = path[i + 2]!;   // path index of bend i is i+1
  const before = i > 0 ? bends[i - 1] : undefined, after = i < bends.length - 1 ? bends[i + 1] : undefined;
  if (before) { if (horizontal(prev, at)) before.y = to.y; else if (vertical(prev, at)) before.x = to.x; }
  if (after) { if (horizontal(at, next)) after.y = to.y; else if (vertical(at, next)) after.x = to.x; }
  bends[i] = { x: to.x, y: to.y };
  return bends;
}

/**
 * Segment `s` (path[s] → path[s+1]) slid by `delta`: a horizontal run moves only up or down,
 * a vertical only sideways, and its two bends go with it (so its neighbours stay orthogonal).
 * A run that starts or ends at a pin first gets a bend at the pin, so the pin stays put and a
 * jog appears. Returns the new bends.
 */
export function slideSegment(path: readonly Point[], s: number, delta: Point): Point[] {
  if (s < 0 || s + 1 >= path.length) return bendsOf(path);
  const a = path[s]!, b = path[s + 1]!;
  const d = horizontal(a, b) ? { x: 0, y: delta.y } : vertical(a, b) ? { x: delta.x, y: 0 } : delta;
  const pts = path.map((p) => ({ ...p }));
  let i = s;
  if (i === 0) { pts.splice(1, 0, { ...pts[0]! }); i = 1; }            // a bend at the FROM pin
  if (i + 1 === pts.length - 1) pts.splice(pts.length - 1, 0, { ...pts.at(-1)! });   // and at the TO pin
  pts[i] = { x: pts[i]!.x + d.x, y: pts[i]!.y + d.y };
  pts[i + 1] = { x: pts[i + 1]!.x + d.x, y: pts[i + 1]!.y + d.y };
  return pts.slice(1, -1);
}

/**
 * The bends after an END moved (its device dragged): the bend next to that end moves with it
 * along the run's axis — a horizontal first run keeps its height with the pin, a vertical one
 * its x — so the wire stays attached and square instead of going diagonal.
 */
export function followEnd(bends: readonly Point[], oldEnd: Point, newEnd: Point, atStart: boolean): Point[] {
  const out = bends.map((p) => ({ ...p }));
  const k = atStart ? 0 : out.length - 1;
  const b = out[k];
  if (!b) return out;
  if (Math.abs(b.y - oldEnd.y) < EPS) b.y += newEnd.y - oldEnd.y;
  else if (Math.abs(b.x - oldEnd.x) < EPS) b.x += newEnd.x - oldEnd.x;
  return out;
}

const OUT: Record<PortSide, Point> = { input: { x: -1, y: 0 }, output: { x: 1, y: 0 }, control: { x: 0, y: 1 }, power: { x: 0, y: -1 } };

/**
 * An orthogonal route from a to b, leaving a along `aSide`'s outward direction and arriving
 * at b along `bSide`'s: the bends only (two or three, on the grid), never a diagonal.
 */
export function orthogonalRoute(a: Point, b: Point, aSide: PortSide = 'output', bSide: PortSide = 'input'): Point[] {
  const da = OUT[aSide], db = OUT[bSide];
  if (Math.abs(a.x - b.x) < EPS || Math.abs(a.y - b.y) < EPS) {
    // in line: straight when it leaves and arrives the right way, else a detour out and back
    const straight = (da.x * (b.x - a.x) + da.y * (b.y - a.y)) > 0 && (db.x * (a.x - b.x) + db.y * (a.y - b.y)) > 0;
    if (straight) return [];
  }
  if (da.x !== 0 && db.x !== 0) {
    const mid = snapAt({ x: (a.x + b.x) / 2, y: 0 }).x;
    const x = (b.x - a.x) * da.x > 0 ? mid : a.x + da.x * 30;
    if ((b.x - a.x) * da.x > 0) return [{ x, y: a.y }, { x, y: b.y }];
    const xb = b.x + db.x * 30, y = snapAt({ x: 0, y: (a.y + b.y) / 2 }).y;
    return [{ x, y: a.y }, { x, y }, { x: xb, y }, { x: xb, y: b.y }];
  }
  if (da.y !== 0 && db.y !== 0) {
    const y = snapAt({ x: 0, y: (a.y + b.y) / 2 }).y;
    return [{ x: a.x, y }, { x: b.x, y }];
  }
  // one horizontal, one vertical: one corner
  return da.x !== 0 ? [{ x: b.x, y: a.y }] : [{ x: a.x, y: b.y }];
}

/** Where a wire's end is drawn: a BIM block's plug-and-lug end on the grid, else the port (cables.ts's rule). */
export function endPoint(model: SchematicModel, ref: PortRef): Point | null {
  const placement = model.placements.find((p) => p.id === ref.placementId);
  const def = placement ? definitionFor(model, placement) : undefined;
  const port = def?.ports.find((p) => p.id === ref.portId);
  if (!placement || !def || !port) return null;
  if (def.hat) return wireEndPoint(placement, def, port);
  return portsOf(model, placement.id).find((r) => r.port === port)?.world ?? null;
}

/** Give a wire an orthogonal route of its own (re-bend). True when it changed. */
export function reroute(model: SchematicModel, id: number): boolean {
  const c = model.connectors.find((w) => w.id === id);
  if (!c) return false;
  const a = endPoint(model, c.from), b = endPoint(model, c.to);
  if (!a || !b) return false;
  const route = orthogonalRoute(a, b, portOf(model, c.from)?.side, portOf(model, c.to)?.side);
  const before = JSON.stringify(c.route ?? []);
  c.route = route;
  return JSON.stringify(route) !== before;
}

/**
 * A wire's bends made its own (from the auto route) so they can be edited: its route when
 * it has one, else the orthogonal route between its pins.
 */
export function ownBends(model: SchematicModel, c: Connector): Point[] {
  if (c.route?.length) return c.route.map((p) => ({ ...p }));
  const a = endPoint(model, c.from), b = endPoint(model, c.to);
  return a && b ? orthogonalRoute(a, b, portOf(model, c.from)?.side, portOf(model, c.to)?.side) : [];
}

/**
 * A device moved by (dx, dy): every wire with a route that ends on it keeps its run square —
 * the bend next to that end follows (followEnd). Call after the placement moved, with where
 * each end WAS (`before`, from `wireEndsOf`).
 */
export function wireEndsOf(model: SchematicModel, placementId: number): Map<string, Point> {
  const out = new Map<string, Point>();
  for (const c of model.connectors) for (const which of ['from', 'to'] as const) {
    if (c[which].placementId !== placementId || !c.route?.length) continue;
    const at = endPoint(model, c[which]);
    if (at) out.set(`${c.id}:${which}`, at);
  }
  return out;
}

export function followDevice(model: SchematicModel, placementId: number, before: Map<string, Point>): boolean {
  let changed = false;
  for (const c of model.connectors) for (const which of ['from', 'to'] as const) {
    const was = before.get(`${c.id}:${which}`);
    if (!was || c[which].placementId !== placementId || !c.route?.length) continue;
    const now = endPoint(model, c[which]);
    if (!now || (now.x === was.x && now.y === was.y)) continue;
    c.route = followEnd(c.route, was, now, which === 'from');
    changed = true;
  }
  return changed;
}

// ------------------------------------------------------------------ status

export type WireStatus = 'ok' | 'dangling' | 'duplicate' | 'crosses a device' | 'net conflict';

function segmentHitsBox(a: Point, b: Point, box: { x0: number; y0: number; x1: number; y1: number }): boolean {
  // Liang–Barsky: does a→b pass through the box's inside (not only touch its edge)?
  let t0 = 0, t1 = 1;
  const dx = b.x - a.x, dy = b.y - a.y;
  const shrink = 0.5;
  const tests: [number, number][] = [[-dx, a.x - (box.x0 + shrink)], [dx, (box.x1 - shrink) - a.x], [-dy, a.y - (box.y0 + shrink)], [dy, (box.y1 - shrink) - a.y]];
  for (const [p, q] of tests) {
    if (Math.abs(p) < EPS) { if (q < 0) return false; continue; }
    const r = q / p;
    if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; }
  }
  return t0 < t1;
}

/** Each wire's state: ok, or what is wrong with it. */
export function wireStatuses(model: SchematicModel): Map<number, WireStatus[]> {
  const out = new Map<number, WireStatus[]>();
  const named = new Map<number, string>();
  for (const n of nets(model)) for (const w of n.wires) named.set(w, n.name);
  const seen = new Set<string>();
  const boxes = model.placements.map((p) => {
    const def = definitionFor(model, p);
    if (!def) return null;
    const cs = outlineCorners(def, p);
    return { id: p.id, x0: Math.min(...cs.map((c) => c.x)), y0: Math.min(...cs.map((c) => c.y)), x1: Math.max(...cs.map((c) => c.x)), y1: Math.max(...cs.map((c) => c.y)) };
  }).filter((b): b is NonNullable<typeof b> => !!b);
  for (const c of [...model.connectors].sort((a, b) => a.id - b.id)) {
    const s: WireStatus[] = [];
    if (!portOf(model, c.from) || !portOf(model, c.to)) s.push('dangling');
    const pair = [pinKey(c.from), pinKey(c.to)].sort().join('~');
    if (seen.has(pair)) s.push('duplicate');
    seen.add(pair);
    const path = !c.fly && s[0] !== 'dangling' ? pathOf(model, c) : null;
    if (path && boxes.some((box) => path.slice(1).some((p, i) => segmentHitsBox(path[i]!, p, box)))) s.push('crosses a device');
    if (c.net && named.get(c.id) && c.net !== named.get(c.id)) s.push('net conflict');
    out.set(c.id, s.length ? s : ['ok']);
  }
  return out;
}

/** Duplicate wires folded into the first of each pair. Returns how many were removed. */
export function mergeDuplicates(model: SchematicModel): number {
  const seen = new Set<string>();
  const drop: number[] = [];
  for (const c of [...model.connectors].sort((a, b) => a.id - b.id)) {
    const pair = [pinKey(c.from), pinKey(c.to)].sort().join('~');
    if (seen.has(pair)) drop.push(c.id);
    seen.add(pair);
  }
  model.connectors = model.connectors.filter((c) => !drop.includes(c.id));
  if (drop.length) normaliseNets(model);
  return drop.length;
}

// ------------------------------------------------------------------ discovery

/** A plain line on the sheet (a Doc line edge, an imported DXF line …). */
export interface LineSegment { id: number; a: Point; b: Point; layer?: string }
/** A pin a line may land on: the port, and the point(s) a wire may end at. */
export interface PinSpot { ref: PortRef; at: Point[] }

export interface WireCandidate {
  /** The lines this wire is made of. */
  segments: number[];
  from: PortRef | null;
  to: PortRef | null;
  /** The run's interior points, in order from `from`'s end. */
  bends: Point[];
  /** Its two ends, as drawn. */
  ends: [Point, Point];
  confidence: 'high' | 'medium' | 'low';
  reason: string;
  dangling: boolean;
  /** These two pins are already wired. */
  duplicate: boolean;
}

/** Every pin of the sheet with the points a line may end on (the port and its wire end). */
export function pinSpots(model: SchematicModel): PinSpot[] {
  const out: PinSpot[] = [];
  for (const p of model.placements) for (const r of portsOf(model, p.id)) {
    const end = endPoint(model, r.ref);
    out.push({ ref: r.ref, at: end && (end.x !== r.world.x || end.y !== r.world.y) ? [r.world, end] : [r.world] });
  }
  return out;
}

const WIRE_LAYER = /\b(wire|wires|cable|cables|net|nets|signal|patch)\b/i;

/**
 * Lines that are wires in fact but not declared: chains of touching segments (a run with
 * no branch), each end matched to a pin within `tol` mm. Both ends on pins → a wire (high
 * when every run is horizontal or vertical); one end on a pin → a dangling candidate; none,
 * but on a layer named like wires → low. Branched chains are left alone (a net, not one
 * wire — draw it as wires). Pure: segments and pins in, candidates out.
 */
export function discoverWires(segments: readonly LineSegment[], pins: readonly PinSpot[], tol: number, model?: SchematicModel): WireCandidate[] {
  // cluster the segment ends into nodes (within tol/2 of each other)
  const nodes: Point[] = [];
  const nodeOf = (p: Point) => {
    const i = nodes.findIndex((n) => Math.hypot(n.x - p.x, n.y - p.y) <= tol / 2);
    if (i >= 0) return i;
    nodes.push({ ...p });
    return nodes.length - 1;
  };
  const segs = segments.map((s) => ({ s, u: nodeOf(s.a), v: nodeOf(s.b) })).filter((e) => e.u !== e.v);
  const adj = new Map<number, number[]>();   // node → segment indexes
  segs.forEach((e, i) => { for (const n of [e.u, e.v]) (adj.get(n) ?? adj.set(n, []).get(n)!).push(i); });
  const used = new Set<number>();
  const out: WireCandidate[] = [];
  const pinAt = (p: Point): PortRef | null => {
    let best: PortRef | null = null, bd = tol;
    for (const pin of pins) for (const at of pin.at) {
      const d = Math.hypot(at.x - p.x, at.y - p.y);
      if (d <= bd) { bd = d; best = pin.ref; }
    }
    return best;
  };
  const degree = (n: number) => adj.get(n)?.length ?? 0;
  const walk = (start: number, first: number) => {
    const order: number[] = [start];
    const segIds: number[] = [];
    let node = start, seg: number | undefined = first;
    while (seg !== undefined && !used.has(seg)) {
      used.add(seg);
      segIds.push(segs[seg]!.s.id);
      const e = segs[seg]!;
      node = e.u === node ? e.v : e.u;
      order.push(node);
      seg = degree(node) === 2 ? adj.get(node)!.find((k) => !used.has(k)) : undefined;
    }
    return { order, segIds };
  };
  const consider = (order: number[], segIds: number[], layers: (string | undefined)[]) => {
    if (degreeOver(order)) return;
    const ends: [Point, Point] = [nodes[order[0]!]!, nodes[order.at(-1)!]!];
    const from = pinAt(ends[0]), to = pinAt(ends[1]);
    const onWireLayer = layers.some((l) => l && WIRE_LAYER.test(l));
    if (!from && !to && !onWireLayer) return;
    if (from && to && samePort(from, to)) return;
    const pts = order.map((n) => nodes[n]!);
    const square = pts.slice(1).every((p, i) => horizontal(pts[i]!, p) || vertical(pts[i]!, p));
    const both = !!from && !!to;
    const [f, t] = from || !to ? [from, to] : [to, from];   // a one-ended run is told from its pin
    const ordered = f === from ? pts : [...pts].reverse();
    const duplicate = both && !!model?.connectors.some((c) => (samePort(c.from, from!) && samePort(c.to, to!)) || (samePort(c.from, to!) && samePort(c.to, from!)));
    out.push({
      segments: segIds, from: f, to: t, bends: ordered.slice(1, -1).map((p) => ({ ...p })), ends: [ordered[0]!, ordered.at(-1)!],
      confidence: both ? (square ? 'high' : 'medium') : 'low',
      reason: both
        ? `${segIds.length === 1 ? 'a line' : `a run of ${segIds.length} touching lines`} ending on two pins${square ? '' : ' (not square)'}`
        : f || t ? 'one end on a pin, the other loose' : 'on a wire layer, neither end on a pin',
      dangling: !both, duplicate,
    });
  };
  const degreeOver = (order: number[]) => order.some((n) => degree(n) > 2);
  // runs from their loose ends first (degree 1), then closed loops are skipped
  for (let n = 0; n < nodes.length; n++) {
    if (degree(n) !== 1) continue;
    const first = adj.get(n)![0]!;
    if (used.has(first)) continue;
    const { order, segIds } = walk(n, first);
    const layers = segIds.map((id) => segments.find((s) => s.id === id)?.layer);
    consider(order, segIds, layers);
  }
  return out;
}

/** Declare candidates as wires (the lines they were drawn with are the caller's to remove). Returns the wires made. */
export function acceptCandidates(model: SchematicModel, candidates: readonly WireCandidate[], layerId = '0'): Connector[] {
  const made: Connector[] = [];
  for (const k of candidates) {
    if (!k.from || !k.to || k.duplicate) continue;
    const c = connect(model, k.from, k.to, layerId, k.bends.length ? k.bends : undefined);
    if (c) made.push(c);
  }
  return made;
}

// ------------------------------------------------------------------ wirelist / netlist

/** The EDITORS.Wirelist columns (wirelistModel.js WIRELIST_COLUMNS), and the net. */
export const WIRELIST_HEADER = ['Wire #', 'Cable Type / Model', 'Len (ft)', 'Len (mm)', 'Origin / Source', 'Origin Connector', 'Destination', 'Destination Connector', 'System', 'Signal Type', 'Color', 'Status', 'Net'] as const;

const MM_PER_FT = 304.8;
const csvCell = (v: unknown) => { const s = v === undefined || v === null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

/** One wirelist row per wire, From and To spelled `DEVICE / PORT` as the Wirelist does. */
export function wirelistRows(model: SchematicModel): string[][] {
  return wireRecords(model).map((w) => {
    const len = w.cable?.length_mm ?? w.length_mm;
    const port = (e: WireEnd) => `${e.device} / ${e.port}${e.pin !== '1' && e.pin !== e.port ? `.${e.pin}` : ''}`;
    const domain = portOf(model, w.from)?.domain ?? portOf(model, w.to)?.domain ?? '';
    return [
      w.cable?.tag ?? `W-${String(w.id).padStart(3, '0')}`, w.cable?.part ?? '',
      len === null || len === undefined ? '' : (len / MM_PER_FT).toFixed(1), len === null || len === undefined ? '' : String(Math.round(len)),
      port(w.from), w.from.connector, port(w.to), w.to.connector, '', domain, w.cable?.colour ?? '', w.cable?.status ?? '', w.net,
    ];
  });
}

export function wirelistCsv(model: SchematicModel): string {
  return [WIRELIST_HEADER as readonly string[], ...wirelistRows(model)].map((r) => r.map(csvCell).join(',')).join('\n') + '\n';
}

/** The netlist: each net, its pins as `DEVICE:PORT`. */
export function netlistRows(model: SchematicModel): { net: string; pins: string[]; wires: number[]; offSheet?: string[] }[] {
  return nets(model).map((n) => ({
    net: n.name,
    pins: n.pins.map((p) => { const e = wireEnd(model, p); return `${e.device}:${e.port}`; }),
    wires: n.wires,
    ...(n.offSheet ? { offSheet: n.offSheet } : {}),
  }));
}

export function netlistCsv(model: SchematicModel): string {
  const rows = netlistRows(model).map((n) => [n.net, String(n.pins.length), n.pins.join(' '), n.wires.map((w) => `W-${String(w).padStart(3, '0')}`).join(' '), (n.offSheet ?? []).join(' ')]);
  return [['Net', 'Pins', 'Members', 'Wires', 'Off sheet'], ...rows].map((r) => r.map(csvCell).join(',')).join('\n') + '\n';
}
