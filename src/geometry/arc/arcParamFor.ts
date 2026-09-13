// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { TAU } from '../../core/constants';
import { clamp01 } from '../../core/clamp01';
import type { ArcGeom } from './arcGeom';

/**
 * Parametric position (0..1) of a point that lies on the arc's circle, or
 * null when the point falls outside the swept span.
 */
export function arcParamFor(g: ArcGeom, px: number, py: number): number | null {
  const ang = Math.atan2(py - g.cy, px - g.cx);
  let d = ang - g.a1;
  while (d < -1e-9) d += TAU;
  while (d >= TAU - 1e-9) d -= TAU;
  if (d < -1e-9 || d > g.sweep + 1e-9) return null;
  return clamp01(d / g.sweep);
}
