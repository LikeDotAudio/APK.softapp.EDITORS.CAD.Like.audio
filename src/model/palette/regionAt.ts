// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { TAU } from '../../core/constants';
import type { Point } from '../../core/types';
import { arcToPolyline } from '../../geometry/arc/arcToPolyline';
import { regions, type OutlineSeg } from '../../geometry/outline/outlines';
import { pointInPolygon } from '../../geometry/polygon/pointInPolygon';
import type { Doc } from '../Doc';

const MAX_SEGS = 3000;

/** The layer's lines as segments, arcs as their polyline. */
function segsOf(doc: Doc, layerId: string): OutlineSeg[] {
  const segs: OutlineSeg[] = [];
  for (const e of doc.edges.values()) {
    if (e.layerId !== layerId) continue;
    const [v1, v2] = doc.endpointsOf(e);
    if (e.type === 'line') {
      segs.push({ a: { x: v1.x, y: v1.y }, b: { x: v2.x, y: v2.y }, edgeId: e.id });
      continue;
    }
    const aFrom = Math.atan2(v1.y - e.cy, v1.x - e.cx);
    let sweep = Math.atan2(v2.y - e.cy, v2.x - e.cx) - aFrom;
    while (sweep <= 0) sweep += TAU;
    const pts = [{ x: v1.x, y: v1.y }, ...arcToPolyline(e.cx, e.cy, e.r, aFrom, sweep), { x: v2.x, y: v2.y }];
    for (let i = 1; i < pts.length; i++) segs.push({ a: pts[i - 1]!, b: pts[i]!, edgeId: e.id });
  }
  return segs;
}

/**
 * The region of `layerId` that a click at `p` lands in — the smallest face
 * its lines enclose, as a counter-clockwise polygon. A wall's elevation with
 * division lines drawn across it is one region per bay: lines that cross,
 * that stop on another (a T) or that overshoot it all count, and what
 * dangles is ignored. Arcs are followed as their polyline. null outside
 * everything.
 */
export function regionAt(doc: Doc, p: Point, layerId: string): Point[] | null {
  const segs = segsOf(doc, layerId);
  // the search is O(n²): a sheet this busy is a plan, not a wall to finish
  if (segs.length > MAX_SEGS) return null;
  let span = 0;
  for (const s of segs) span = Math.max(span, Math.abs(s.a.x), Math.abs(s.a.y), Math.abs(s.b.x), Math.abs(s.b.y));
  let best: Point[] | null = null;
  let bestArea = Infinity;
  for (const r of regions(segs, Math.max(1e-9, span * 1e-6))) {
    if (r.area < bestArea && pointInPolygon(p.x, p.y, r.points)) {
      best = r.points;
      bestArea = r.area;
    }
  }
  return best;
}

/**
 * Where tiles `w` × `h` go in `poly` at their real size: a grid from the
 * region's bottom-left corner, each cell kept only when it lies wholly inside
 * (all four corners, and its middle). Centres, in drawing units.
 */
export function tileCentres(poly: Point[], w: number, h: number): Point[] {
  if (!(w > 0 && h > 0) || poly.length < 3) return [];
  const xs = poly.map((q) => q.x);
  const ys = poly.map((q) => q.y);
  const x0 = Math.min(...xs);
  const y0 = Math.min(...ys);
  const nx = Math.floor((Math.max(...xs) - x0) / w + 1e-6);
  const ny = Math.floor((Math.max(...ys) - y0) / h + 1e-6);
  const eps = Math.min(w, h) * 1e-4;
  const inside = (x: number, y: number) => pointInPolygon(x, y, poly);
  const out: Point[] = [];
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++) {
      const ax = x0 + i * w + eps;
      const ay = y0 + j * h + eps;
      const bx = x0 + (i + 1) * w - eps;
      const by = y0 + (j + 1) * h - eps;
      if (inside(ax, ay) && inside(bx, ay) && inside(bx, by) && inside(ax, by) && inside((ax + bx) / 2, (ay + by) / 2)) out.push({ x: (ax + bx) / 2, y: (ay + by) / 2 });
    }
  return out;
}
