// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { TAU } from '../../core/constants';
import type { Layer, Units } from '../../core/types';
import { arcToPolyline } from '../../geometry/arc/arcToPolyline';
import type { Doc } from '../../model/Doc';
import { paletteFootprint } from '../../model/palette/paletteFootprint';
import { connectedComponents } from '../../model/topology/connectedComponents';
import { cyclePoints } from '../../model/topology/cyclePoints';
import { cycleWalk } from '../../model/topology/cycleWalk';
import { outlines, type Outline, type OutlineSeg } from '../../geometry/outline/outlines';

/**
 * WHAT A HOST APP SEES OF THE SHEET
 *
 * A softapp that embeds this editor (the acoustic overlay is the first) does
 * not get the Doc: it gets the drawing flattened to what it can reason about
 * without knowing this app's graph — straight wall segments, and the closed
 * loops among them as polygons. Arcs are tessellated here, once, so a host
 * never has to know the CCW-from-v1 convention.
 *
 * Hidden layers are left out: what the host draws over must match what the
 * user can see under it.
 *
 * ROOMS are the closed loops, three ways (`kind`):
 *   'loop'     a connected drawing that is exactly one loop of joints;
 *   'outline'  the lines of one layer that make more than that — walls
 *              overshooting at the corners, partitions ending on a wall with
 *              no joint, stubs, rooms sharing a wall — give the outline of
 *              each connected piece (geometry/outline): a captured plan is a
 *              room without anyone saying so;
 *   'picked'   edges the user selected whose lines outline a room on their
 *              own, whatever else touches them — `picked` lists every such
 *              set the bridge has seen selected this session.
 * An outline the same shape as a room already found is not repeated. A
 * room's layer is the one most of its edges are on. Ids: a loop's is its
 * smallest edge id; an outline's the negative of that; a picked room's the
 * negative less a million — so no two kinds can share one.
 *
 * Each LAYER carries its `finish`, a host palette id, when it has one.
 *
 * `patches` are the host's own palette materials, painted back onto the sheet:
 * every fill and every block instance that carries a `paletteId`, as a polygon
 * in the same drawing frame as the walls. The host knows what the id means;
 * all this side owes it is where the thing is.
 */

export type HostXY = [number, number];

export interface HostWall {
  /** The CAD edge this segment came from; an arc yields several segments. */
  edgeId: number;
  a: HostXY;
  b: HostXY;
  layerId: string;
}

export interface HostRoom {
  /** Stable while the loop's edges are: the smallest edge id in it. */
  id: number;
  layerId: string;
  points: HostXY[];
  /** How it was found: one clean loop, a drawing's outline, or a selection. */
  kind: 'loop' | 'outline' | 'picked';
}

export interface HostLayer {
  id: string;
  name: string;
  color: string;
  /** A host palette finish for everything on the layer. */
  finish?: string;
}

export interface HostPatch {
  /** `fill:<id>` for a painted finish, `block:<id>` for a placed product. */
  id: string;
  paletteId: string;
  layerId: string;
  points: HostXY[];
  /** A placed product only: its centre and turn (degrees CCW) — what `move` sets. */
  at?: HostXY;
  rotation?: number;
}

export interface HostGeometry {
  units: Units;
  walls: HostWall[];
  rooms: HostRoom[];
  layers: HostLayer[];
  patches: HostPatch[];
}

/** Every visible edge as straight segments, arcs tessellated: the walls a host sees. */
export function wallsForHost(doc: Doc, layers: ReadonlyMap<string, Layer>): HostWall[] {
  const visible = (layerId: string) => layers.get(layerId)?.visible !== false;
  const walls: HostWall[] = [];

  for (const e of doc.edges.values()) {
    if (!visible(e.layerId)) continue;
    const [v1, v2] = doc.endpointsOf(e);
    if (e.type === 'line') {
      walls.push({ edgeId: e.id, a: [v1.x, v1.y], b: [v2.x, v2.y], layerId: e.layerId });
      continue;
    }
    const aFrom = Math.atan2(v1.y - e.cy, v1.x - e.cx);
    let sweep = Math.atan2(v2.y - e.cy, v2.x - e.cx) - aFrom;
    while (sweep <= 0) sweep += TAU;
    const pts = [{ x: v1.x, y: v1.y }, ...arcToPolyline(e.cx, e.cy, e.r, aFrom, sweep), { x: v2.x, y: v2.y }];
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i - 1]!;
      const q = pts[i]!;
      walls.push({ edgeId: e.id, a: [p.x, p.y], b: [q.x, q.y], layerId: e.layerId });
    }
  }

  return walls;
}

/** A layer with more lines than this is not outlined: the search is O(n²) and runs on every change. */
const MAX_OUTLINE_SEGS = 3000;

/** How close two lines must come to count as joined: a millionth of the drawing's size, and never under 1e-9. */
function outlineTolerance(walls: readonly HostWall[]): number {
  let span = 0;
  for (const w of walls) span = Math.max(span, Math.abs(w.a[0]), Math.abs(w.a[1]), Math.abs(w.b[0]), Math.abs(w.b[1]));
  return Math.max(1e-9, span * 1e-6);
}

/** The same polygon, whichever corner it starts at: equal area and equal bounds. */
function sameShape(a: readonly HostXY[], b: readonly HostXY[]): boolean {
  const area = (p: readonly HostXY[]) => Math.abs(p.reduce((s, q, i) => s + q[0] * p[(i + 1) % p.length]![1] - p[(i + 1) % p.length]![0] * q[1], 0) / 2);
  const box = (p: readonly HostXY[]) => [Math.min(...p.map((q) => q[0])), Math.min(...p.map((q) => q[1])), Math.max(...p.map((q) => q[0])), Math.max(...p.map((q) => q[1]))];
  const A = area(a);
  const B = area(b);
  if (Math.abs(A - B) > 1e-6 * Math.max(A, B, 1e-12)) return false;
  const ba = box(a);
  const bb = box(b);
  const size = Math.max(ba[2]! - ba[0]!, ba[3]! - ba[1]!, 1e-12);
  return ba.every((v, i) => Math.abs(v - bb[i]!) <= 1e-6 * size);
}

/**
 * Selected edges as a room: the outline their lines make on their own (the
 * largest, if they make several), or null. `walls` are the sheet's segments.
 */
export function pickedOutline(walls: readonly HostWall[], edgeIds: readonly number[], tol = outlineTolerance(walls)): Outline | null {
  const want = new Set(edgeIds);
  const segs = walls.filter((w) => want.has(w.edgeId)).map((w) => ({ a: { x: w.a[0], y: w.a[1] }, b: { x: w.b[0], y: w.b[1] }, edgeId: w.edgeId }));
  const found = outlines(segs, tol);
  return found.length ? found.reduce((x, y) => (y.area > x.area ? y : x)) : null;
}

export function sceneForHost(doc: Doc, units: Units, layers: ReadonlyMap<string, Layer>, picked: readonly (readonly number[])[] = []): HostGeometry {
  const visible = (layerId: string) => layers.get(layerId)?.visible !== false;
  const walls = wallsForHost(doc, layers);

  const rooms: HostRoom[] = [];
  const layerOf = (edgeIds: readonly number[]) => {
    const count = new Map<string, number>();
    for (const id of edgeIds) {
      const l = doc.edge(id)?.layerId ?? '0';
      count.set(l, (count.get(l) ?? 0) + 1);
    }
    return [...count.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '0';
  };
  for (const comp of connectedComponents(doc)) {
    const walk = cycleWalk(doc, comp);
    if (!walk) continue;
    const layerId = layerOf(walk.edgeSeq);
    if (!visible(layerId)) continue;
    rooms.push({ id: Math.min(...walk.edgeSeq), layerId, points: cyclePoints(doc, walk).map((p) => [p.x, p.y]), kind: 'loop' });
  }
  const addOutline = (o: Outline, kind: 'outline' | 'picked') => {
    const pts: HostXY[] = o.points.map((p) => [p.x, p.y]);
    if (rooms.some((r) => sameShape(r.points, pts))) return;
    const layerId = layerOf(o.edgeIds);
    if (!visible(layerId)) return;
    const min = Math.min(...o.edgeIds);
    rooms.push({ id: kind === 'outline' ? -min : -min - 1_000_000, layerId, points: pts, kind });
  };
  // every layer's lines, as a person reads them
  const byLayer = new Map<string, OutlineSeg[]>();
  for (const w of walls) (byLayer.get(w.layerId) ?? byLayer.set(w.layerId, []).get(w.layerId)!).push({ a: { x: w.a[0], y: w.a[1] }, b: { x: w.b[0], y: w.b[1] }, edgeId: w.edgeId });
  const tol = outlineTolerance(walls);
  for (const segs of byLayer.values()) if (segs.length <= MAX_OUTLINE_SEGS) for (const o of outlines(segs, tol)) addOutline(o, 'outline');
  for (const ids of picked) {
    const o = pickedOutline(walls, ids, tol);
    if (o) addOutline(o, 'picked');
  }

  const patches: HostPatch[] = [];
  for (const f of doc.fills.values()) {
    if (!f.paletteId || !visible(f.layerId) || f.points.length < 3) continue;
    patches.push({
      id: `fill:${f.id}`,
      paletteId: f.paletteId,
      layerId: f.layerId,
      points: f.points.map((p) => [p.x, p.y]),
    });
  }
  for (const inst of doc.blockInstances.values()) {
    const paletteId = inst.attributes?.paletteId;
    if (!paletteId || !visible(inst.layerId)) continue;
    const pts = paletteFootprint(doc, inst);
    if (!pts) continue;
    patches.push({ id: `block:${inst.id}`, paletteId, layerId: inst.layerId, points: pts.map((p) => [p.x, p.y]), at: [inst.x, inst.y], rotation: inst.rotation ?? 0 });
  }

  return {
    units,
    walls,
    rooms,
    patches,
    layers: [...layers.values()].map((l) => ({ id: l.id, name: l.name, color: l.color, ...(l.finish ? { finish: l.finish } : {}) })),
  };
}
