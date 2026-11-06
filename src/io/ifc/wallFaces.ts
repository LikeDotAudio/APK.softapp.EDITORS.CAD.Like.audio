// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Edge, Point, Vertex } from '../../core/types';

/**
 * THE ROOMS THE WALLS ENCLOSE (cad-4)
 *
 * Every bounded face of the wall graph, each one IfcSpace: two rooms sharing
 * a wall are two faces, where the host's `outline` would see one shape. The
 * walk is the usual planar one — leave each corner by the next wall clockwise
 * from the one you came in on — and the unbounded face (the outside) is the
 * one with negative area. An arc is taken by its chord here; its true curve
 * stays on the wall's Axis.
 *
 * A face's key is its walls' edge ids, sorted: it is the same room as long as
 * the same walls enclose it, whatever is drawn elsewhere.
 */
export interface WallFace {
  key: string;
  edgeIds: number[];
  points: Point[];
}

export function wallFaces(vertices: readonly Vertex[], edges: readonly Edge[]): WallFace[] {
  const at = new Map(vertices.map((v) => [v.id, v]));
  type Half = { from: number; to: number; edge: number; angle: number };
  const out = new Map<number, Half[]>();
  for (const e of edges) {
    const a = at.get(e.v1), b = at.get(e.v2);
    if (!a || !b || e.v1 === e.v2) continue;
    const ab: Half = { from: e.v1, to: e.v2, edge: e.id, angle: Math.atan2(b.y - a.y, b.x - a.x) };
    const ba: Half = { from: e.v2, to: e.v1, edge: e.id, angle: Math.atan2(a.y - b.y, a.x - b.x) };
    (out.get(e.v1) ?? out.set(e.v1, []).get(e.v1)!).push(ab);
    (out.get(e.v2) ?? out.set(e.v2, []).get(e.v2)!).push(ba);
  }
  for (const list of out.values()) list.sort((x, y) => x.angle - y.angle);
  const used = new Set<Half>();
  const faces: WallFace[] = [];
  for (const list of out.values()) {
    for (const start of list) {
      if (used.has(start)) continue;
      const ring: Half[] = [];
      let h: Half | undefined = start;
      for (let guard = 0; h && !used.has(h) && guard < 100000; guard++) {
        used.add(h);
        ring.push(h);
        // at h.to, the half-edge back is (to → from); take the next one clockwise from it
        const around: Half[] = out.get(h.to) ?? [];
        const back = around.findIndex((x) => x.to === h!.from && x.edge === h!.edge);
        h = around[(back - 1 + around.length) % around.length];
      }
      if (h !== start || ring.length < 3) continue;
      const pts = ring.map((x) => at.get(x.from)!);
      let area = 0;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i]!, q = pts[(i + 1) % pts.length]!;
        area += p.x * q.y - q.x * p.y;
      }
      if (area <= 0) continue;
      const ids = [...new Set(ring.map((x) => x.edge))].sort((x, y) => x - y);
      faces.push({ key: `walls:${ids.join('.')}`, edgeIds: ids, points: pts.map((p) => ({ x: p.x, y: p.y })) });
    }
  }
  return faces.sort((x, y) => (x.key < y.key ? -1 : x.key > y.key ? 1 : 0));
}
