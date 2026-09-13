// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { TAU } from '../../core/constants';
import type { Point } from '../../core/types';
import type { ArcGeom } from './arcGeom';

/** Distance from a point to the arc (radially inside the sweep, else to an endpoint). */
export function arcDistance(g: ArcGeom, from: Point, to: Point, px: number, py: number): number {
  const d = Math.hypot(px - g.cx, py - g.cy);
  const ang = Math.atan2(py - g.cy, px - g.cx);
  let delta = ang - g.a1;
  while (delta < 0) delta += TAU;
  while (delta >= TAU) delta -= TAU;
  if (delta <= g.sweep) return Math.abs(d - g.r);
  return Math.min(Math.hypot(px - from.x, py - from.y), Math.hypot(px - to.x, py - to.y));
}
