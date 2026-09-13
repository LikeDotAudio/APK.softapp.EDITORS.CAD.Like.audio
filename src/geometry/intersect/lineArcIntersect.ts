// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { PARAM_EPS } from '../../core/constants';
import type { Point } from '../../core/types';
import type { ArcGeom } from '../arc/arcGeom';
import { arcParamFor } from '../arc/arcParamFor';
import type { LineLineHit } from './lineLineIntersect';

/** `t` is along the segment, `s` is along the arc. */
export function lineArcIntersect(la1: Point, la2: Point, arc: ArcGeom): LineLineHit[] {
  const dx = la2.x - la1.x;
  const dy = la2.y - la1.y;
  const fx = la1.x - arc.cx;
  const fy = la1.y - arc.cy;
  const A = dx * dx + dy * dy;
  if (A < 1e-20) return [];
  const B = 2 * (fx * dx + fy * dy);
  const C = fx * fx + fy * fy - arc.r * arc.r;
  const disc = B * B - 4 * A * C;
  if (disc < -1e-12) return [];
  const sq = Math.sqrt(Math.max(0, disc));
  const e = PARAM_EPS;
  const out: LineLineHit[] = [];
  for (const t of [(-B - sq) / (2 * A), (-B + sq) / (2 * A)]) {
    if (t <= e || t >= 1 - e) continue;
    const px = la1.x + t * dx;
    const py = la1.y + t * dy;
    const s = arcParamFor(arc, px, py);
    if (s !== null && s > e && s < 1 - e) out.push({ t, s, x: px, y: py });
  }
  return out;
}
