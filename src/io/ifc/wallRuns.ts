// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Edge, Point, Vertex } from '../../core/types';

/**
 * ONE WALL WHERE THE DRAWING HAS ONE WALL (ROAD-3581, cad-4)
 *
 * The CAD welds: drawing a partition into a wall cuts the wall's edge in two
 * at the junction, so one straight wall becomes two edges. IFC wants the wall
 * the builder builds — one IfcWall — with the partition joined to it.
 *
 * A run is a chain of straight edges on one layer that continue each other:
 * at a corner where two of them leave in exactly opposite directions (and no
 * third does the same), they are one wall passing through. A T junction keeps
 * the through-wall whole; a crossing keeps both. An arc is a run of its own.
 * A run's id is its lowest edge id, so its GlobalId stays put while the same
 * edges make it, and it points the way that edge does.
 *
 * A join is two runs meeting at a corner: IfcRelConnectsPathElements, each
 * end typed ATSTART / ATEND, or ATPATH where the corner is inside the run.
 */
export interface WallRun {
  /** Lowest edge id: the run's identity. */
  id: number;
  layerId: string;
  /** Edges in order along the run; e[i] joins vertexIds[i] and vertexIds[i + 1]. */
  edgeIds: number[];
  vertexIds: number[];
  /** The run's points, start to end (drawing units, as the vertices). */
  points: Point[];
  arc: boolean;
}

export type JoinType = 'ATSTART' | 'ATEND' | 'ATPATH';

export interface WallJoin {
  vertexId: number;
  /** The run with the lower id relates; the other is related. */
  relating: number;
  relatingType: JoinType;
  related: number;
  relatedType: JoinType;
}

const TURN = 1e-9;

export function wallRuns(vertices: readonly Vertex[], edges: readonly Edge[]): { runs: WallRun[]; joins: WallJoin[] } {
  const at = new Map(vertices.map((v) => [v.id, v]));
  const usable = edges.filter((e) => at.has(e.v1) && at.has(e.v2) && e.v1 !== e.v2);
  const byId = new Map(usable.map((e) => [e.id, e]));
  // the straight edges leaving each vertex, with their heading
  const leaving = new Map<number, { edge: Edge; angle: number }[]>();
  for (const e of usable) {
    if (e.type !== 'line') continue;
    const a = at.get(e.v1)!, b = at.get(e.v2)!;
    for (const [from, to] of [[a, b], [b, a]] as const) {
      (leaving.get(from.id) ?? leaving.set(from.id, []).get(from.id)!).push({ edge: e, angle: Math.atan2(to.y - from.y, to.x - from.x) });
    }
  }
  const opposite = (x: number, y: number) => {
    const d = (((x - y) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    return Math.abs(d - Math.PI) < TURN;
  };
  /** At vertex v, the edge that continues `e` straight on — when exactly one does, and it chooses `e` back. */
  const through = new Map<string, number>();
  for (const [v, list] of leaving) {
    const partners = (x: { edge: Edge; angle: number }) =>
      list.filter((y) => y.edge.id !== x.edge.id && y.edge.layerId === x.edge.layerId && opposite(x.angle, y.angle));
    for (const x of list) {
      const p = partners(x);
      if (p.length !== 1 || partners(p[0]!).length !== 1) continue;
      through.set(`${v}:${x.edge.id}`, p[0]!.edge.id);
    }
  }
  const other = (e: Edge, v: number) => (e.v1 === v ? e.v2 : e.v1);

  const runOf = new Map<number, WallRun>();
  const runs: WallRun[] = [];
  for (const e of [...usable].sort((x, y) => x.id - y.id)) {
    if (runOf.has(e.id)) continue;
    // walk forward from v2, then backward from v1
    const fwdE: number[] = [], fwdV: number[] = [];
    const seen = new Set([e.id]);
    for (let cur = e, v = e.v2; ;) {
      const next = cur.type === 'line' ? through.get(`${v}:${cur.id}`) : undefined;
      if (next === undefined || seen.has(next)) break;
      seen.add(next);
      fwdE.push(next);
      cur = byId.get(next)!;
      v = other(cur, v);
      fwdV.push(v);
    }
    const backE: number[] = [], backV: number[] = [];
    for (let cur = e, v = e.v1; ;) {
      const next = cur.type === 'line' ? through.get(`${v}:${cur.id}`) : undefined;
      if (next === undefined || seen.has(next)) break;
      seen.add(next);
      backE.push(next);
      cur = byId.get(next)!;
      v = other(cur, v);
      backV.push(v);
    }
    const edgeIds = [...backE.reverse(), e.id, ...fwdE];
    const vertexIds = [...backV.reverse(), e.v1, e.v2, ...fwdV];
    // `e` is the lowest id of its run (edges are taken in id order): the run points its way, v1 → v2
    const run: WallRun = { id: e.id, layerId: e.layerId, edgeIds, vertexIds, points: vertexIds.map((id) => ({ x: at.get(id)!.x, y: at.get(id)!.y })), arc: e.type === 'arc' };
    for (const id of edgeIds) runOf.set(id, run);
    runs.push(run);
  }

  const joins: WallJoin[] = [];
  const touching = new Map<number, Set<WallRun>>();
  for (const r of runs) for (const v of r.vertexIds) (touching.get(v) ?? touching.set(v, new Set()).get(v)!).add(r);
  const typeAt = (r: WallRun, v: number): JoinType => (r.vertexIds[0] === v ? 'ATSTART' : r.vertexIds[r.vertexIds.length - 1] === v ? 'ATEND' : 'ATPATH');
  for (const [v, set] of [...touching].sort((x, y) => x[0] - y[0])) {
    const list = [...set].sort((x, y) => x.id - y.id);
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i]!, b = list[j]!;
        joins.push({ vertexId: v, relating: a.id, relatingType: typeAt(a, v), related: b.id, relatedType: typeAt(b, v) });
      }
    }
  }
  return { runs, joins };
}

/** Index runs by every edge they hold. */
export function runByEdge(runs: readonly WallRun[]): Map<number, WallRun> {
  const m = new Map<number, WallRun>();
  for (const r of runs) for (const id of r.edgeIds) m.set(id, r);
  return m;
}
