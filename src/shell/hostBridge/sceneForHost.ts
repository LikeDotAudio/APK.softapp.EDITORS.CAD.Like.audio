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
}

export interface HostLayer {
  id: string;
  name: string;
  color: string;
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

export function sceneForHost(doc: Doc, units: Units, layers: ReadonlyMap<string, Layer>): HostGeometry {
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

  const rooms: HostRoom[] = [];
  for (const comp of connectedComponents(doc)) {
    const walk = cycleWalk(doc, comp);
    if (!walk) continue;
    const first = doc.edge(walk.edgeSeq[0]!);
    if (!first || !visible(first.layerId)) continue;
    rooms.push({
      id: Math.min(...walk.edgeSeq),
      layerId: first.layerId,
      points: cyclePoints(doc, walk).map((p) => [p.x, p.y]),
    });
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
    layers: [...layers.values()].map((l) => ({ id: l.id, name: l.name, color: l.color })),
  };
}
