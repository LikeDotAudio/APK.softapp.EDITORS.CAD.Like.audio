// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Point } from '../../core/types';

/**
 * THE OUTLINES OF A PILE OF LINES
 *
 * A captured plan is lines, not a graph: walls overshoot each other at the
 * corners, partitions stop on a wall without a joint, stubs hang off. The
 * room is still plain to see — this finds it the way the eye does:
 *
 *   1. split every segment wherever another crosses or touches it (within
 *      `tol`), so every crossing and every T is a joint;
 *   2. trim what dangles — a joint with one line, repeatedly — so stubs and
 *      overshoots go;
 *   3. trace the faces of what is left: arriving at a joint, leave by the
 *      next line clockwise. Bounded faces come out counter-clockwise, the
 *      unbounded one clockwise; its boundary, walked backwards, is the
 *      OUTLINE of that connected piece.
 *
 * `segs` carry the id of the drawing edge each came from, so a room found
 * this way can say which edges it is made of. Pure geometry, O(n²) in the
 * segments: give it one layer at a time.
 */
export interface OutlineSeg {
  a: Point;
  b: Point;
  edgeId: number;
}

export interface Outline {
  /** Counter-clockwise, no repeated closing point. */
  points: Point[];
  /** The drawing edges its boundary runs along. */
  edgeIds: number[];
  area: number;
}

interface Traced {
  pos: Point[];
  edges: Map<string, { u: number; v: number; edgeId: number }>;
  around: Map<number, { to: number; k: string; angle: number }[]>;
  faces: { verts: number[]; ks: string[]; area: number }[];
}

/** Steps 1–3: the joints, the lines left between them, and every face they trace; null when nothing closes. */
function trace(segs: readonly OutlineSeg[], tol: number): Traced | null {
  const n = segs.length;
  if (n < 3) return null;
  // 1. split parameters along each segment
  const cuts: number[][] = segs.map(() => [0, 1]);
  const cross = (ax: number, ay: number, bx: number, by: number) => ax * by - ay * bx;
  for (let i = 0; i < n; i++) {
    const s = segs[i]!;
    const rx = s.b.x - s.a.x;
    const ry = s.b.y - s.a.y;
    const lenR = Math.hypot(rx, ry);
    if (lenR < tol) continue;
    for (let j = i + 1; j < n; j++) {
      const q = segs[j]!;
      const sx = q.b.x - q.a.x;
      const sy = q.b.y - q.a.y;
      const lenS = Math.hypot(sx, sy);
      if (lenS < tol) continue;
      const den = cross(rx, ry, sx, sy);
      const qpx = q.a.x - s.a.x;
      const qpy = q.a.y - s.a.y;
      if (Math.abs(den) > tol * lenR * lenS) {
        const t = cross(qpx, qpy, sx, sy) / den;
        const u = cross(qpx, qpy, rx, ry) / den;
        const et = tol / lenR;
        const eu = tol / lenS;
        if (t >= -et && t <= 1 + et && u >= -eu && u <= 1 + eu) {
          cuts[i]!.push(Math.min(1, Math.max(0, t)));
          cuts[j]!.push(Math.min(1, Math.max(0, u)));
        }
      } else {
        // parallel: an end of one lying on the other is still a joint
        const onto = (p: Point, a: Point, dx: number, dy: number, len: number) => {
          const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / (len * len);
          const d = Math.abs(cross(p.x - a.x, p.y - a.y, dx, dy)) / len;
          return d <= tol && t > -tol / len && t < 1 + tol / len ? Math.min(1, Math.max(0, t)) : null;
        };
        for (const p of [q.a, q.b]) {
          const t = onto(p, s.a, rx, ry, lenR);
          if (t !== null) cuts[i]!.push(t);
        }
        for (const p of [s.a, s.b]) {
          const u = onto(p, q.a, sx, sy, lenS);
          if (u !== null) cuts[j]!.push(u);
        }
      }
    }
  }
  // the joints, snapped to the tolerance grid, and the pieces between them
  const key = (p: Point) => `${Math.round(p.x / tol)},${Math.round(p.y / tol)}`;
  const vid = new Map<string, number>();
  const pos: Point[] = [];
  const vertex = (p: Point) => {
    const k = key(p);
    let id = vid.get(k);
    if (id === undefined) {
      id = pos.length;
      vid.set(k, id);
      pos.push({ x: p.x, y: p.y });
    }
    return id;
  };
  const edges = new Map<string, { u: number; v: number; edgeId: number }>();
  segs.forEach((s, i) => {
    const ts = [...new Set(cuts[i]!.map((t) => +t.toFixed(9)))].sort((a, b) => a - b);
    for (let k = 1; k < ts.length; k++) {
      const at = (t: number) => ({ x: s.a.x + (s.b.x - s.a.x) * t, y: s.a.y + (s.b.y - s.a.y) * t });
      const u = vertex(at(ts[k - 1]!));
      const v = vertex(at(ts[k]!));
      if (u === v) continue;
      const ek = u < v ? `${u}-${v}` : `${v}-${u}`;
      if (!edges.has(ek)) edges.set(ek, { u, v, edgeId: s.edgeId });
    }
  });
  // 2. trim what dangles
  const at = new Map<number, Set<string>>();
  for (const [k, e] of edges) for (const x of [e.u, e.v]) (at.get(x) ?? at.set(x, new Set()).get(x)!).add(k);
  const stack = [...at.entries()].filter(([, s]) => s.size === 1).map(([v]) => v);
  while (stack.length) {
    const v = stack.pop()!;
    for (const k of [...(at.get(v) ?? [])]) {
      const e = edges.get(k);
      if (!e) continue;
      edges.delete(k);
      for (const x of [e.u, e.v]) {
        const s = at.get(x)!;
        s.delete(k);
        if (s.size === 1) stack.push(x);
      }
    }
  }
  if (edges.size < 3) return null;
  // 3. faces: each joint's lines by angle
  const around = new Map<number, { to: number; k: string; angle: number }[]>();
  for (const [k, e] of edges)
    for (const [a, b] of [[e.u, e.v], [e.v, e.u]] as [number, number][]) {
      if (!around.has(a)) around.set(a, []);
      around.get(a)!.push({ to: b, k, angle: Math.atan2(pos[b]!.y - pos[a]!.y, pos[b]!.x - pos[a]!.x) });
    }
  for (const l of around.values()) l.sort((x, y) => x.angle - y.angle);
  const used = new Set<string>();
  const faces: { verts: number[]; ks: string[]; area: number }[] = [];
  for (const [k0, e0] of edges)
    for (const [s0, t0] of [[e0.u, e0.v], [e0.v, e0.u]] as [number, number][]) {
      if (used.has(`${s0}>${t0}`)) continue;
      const verts: number[] = [];
      const ks: string[] = [];
      let from = s0;
      let to = t0;
      let k = k0;
      let area = 0;
      for (let guard = 0; guard <= 2 * edges.size + 2 && !used.has(`${from}>${to}`); guard++) {
        used.add(`${from}>${to}`);
        verts.push(from);
        ks.push(k);
        area += pos[from]!.x * pos[to]!.y - pos[to]!.x * pos[from]!.y;
        const list = around.get(to)!;
        const back = list.findIndex((x) => x.to === from && x.k === k);
        const next = list[(back - 1 + list.length) % list.length]!;
        from = to;
        to = next.to;
        k = next.k;
      }
      faces.push({ verts, ks, area: area / 2 });
    }
  return { pos, edges, around, faces };
}

export function outlines(segs: readonly OutlineSeg[], tol = 1e-6): Outline[] {
  const traced = trace(segs, tol);
  if (!traced) return [];
  const { pos, edges, around, faces } = traced;
  // the unbounded face of each connected piece: clockwise, and the largest of its piece in size
  const out: Outline[] = [];
  const taken = new Set<number>();
  for (const f of faces.filter((x) => x.area < -tol).sort((a, b) => a.area - b.area)) {
    if (f.verts.some((v) => taken.has(v))) continue;
    // every joint of this piece is spoken for
    const piece = new Set<number>();
    const walk = [f.verts[0]!];
    while (walk.length) {
      const v = walk.pop()!;
      if (piece.has(v)) continue;
      piece.add(v);
      for (const x of around.get(v) ?? []) if (edges.has(x.k)) walk.push(x.to);
    }
    for (const v of piece) taken.add(v);
    const points = [...f.verts].reverse().map((v) => ({ x: pos[v]!.x, y: pos[v]!.y }));
    out.push({ points, edgeIds: [...new Set(f.ks.map((k) => edges.get(k)!.edgeId))], area: -f.area });
  }
  return out;
}

/**
 * THE REGIONS BETWEEN THE LINES
 *
 * Every bounded face, counter-clockwise: a wall's outline with division lines
 * drawn across it comes back as one region per bay, the cells a painter
 * clicks into. A face with a separate piece inside it (an island) is still
 * its outer boundary alone — the island is a region of its own and, being
 * smaller, is the one a click inside it finds.
 */
export function regions(segs: readonly OutlineSeg[], tol = 1e-6): Outline[] {
  const traced = trace(segs, tol);
  if (!traced) return [];
  const { pos, edges } = traced;
  return traced.faces
    .filter((f) => f.area > tol)
    .map((f) => ({ points: f.verts.map((v) => ({ x: pos[v]!.x, y: pos[v]!.y })), edgeIds: [...new Set(f.ks.map((k) => edges.get(k)!.edgeId))], area: f.area }));
}
