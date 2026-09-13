// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { PARAM_EPS } from '../../core/constants';
import type { Point } from '../../core/types';
import type { ArcGeom } from '../arc/arcGeom';
import { arcParamFor } from '../arc/arcParamFor';

/** Intersection of two arcs, parameterised along each of them. */
export interface ArcArcHit {
  s1: number;
  s2: number;
  x: number;
  y: number;
}

/** Radical-line solution, then reject hits outside either arc's sweep. */
export function arcArcIntersect(a1: ArcGeom, a2: ArcGeom): ArcArcHit[] {
  const dx = a2.cx - a1.cx;
  const dy = a2.cy - a1.cy;
  const d = Math.hypot(dx, dy);
  if (d < 1e-12 || d > a1.r + a2.r + 1e-9 || d < Math.abs(a1.r - a2.r) - 1e-9) return [];
  const a = (a1.r * a1.r - a2.r * a2.r + d * d) / (2 * d);
  const h2 = a1.r * a1.r - a * a;
  if (h2 < -1e-12) return [];
  const h = Math.sqrt(Math.max(0, h2));
  const mx = a1.cx + (a * dx) / d;
  const my = a1.cy + (a * dy) / d;
  const hx = (-dy / d) * h;
  const hy = (dx / d) * h;
  const cand: Point[] = [{ x: mx + hx, y: my + hy }];
  if (h > 1e-10) cand.push({ x: mx - hx, y: my - hy });
  const e = PARAM_EPS;
  const out: ArcArcHit[] = [];
  for (const p of cand) {
    const s1 = arcParamFor(a1, p.x, p.y);
    const s2 = arcParamFor(a2, p.x, p.y);
    if (s1 !== null && s2 !== null && s1 > e && s1 < 1 - e && s2 > e && s2 < 1 - e) {
      out.push({ s1, s2, x: p.x, y: p.y });
    }
  }
  return out;
}
