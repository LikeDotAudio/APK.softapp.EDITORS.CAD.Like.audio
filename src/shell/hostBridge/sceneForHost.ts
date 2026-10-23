// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { TAU } from '../../core/constants';
import type { Layer, Units } from '../../core/types';
import { arcToPolyline } from '../../geometry/arc/arcToPolyline';
import type { Doc } from '../../model/Doc';
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

export interface HostGeometry {
  units: Units;
  walls: HostWall[];
  rooms: HostRoom[];
  layers: HostLayer[];
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

  return {
    units,
    walls,
    rooms,
    layers: [...layers.values()].map((l) => ({ id: l.id, name: l.name, color: l.color })),
  };
}
