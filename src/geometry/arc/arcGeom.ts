// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { TAU } from '../../core/constants';
import type { Point } from '../../core/types';

/**
 * A resolved arc: centre, radius and the CCW span from `a1` to `a2`.
 * `sweep` is always positive — arcs in this model only ever run CCW.
 */
export interface ArcGeom {
  cx: number;
  cy: number;
  r: number;
  a1: number;
  a2: number;
  sweep: number;
}

/** Build an ArcGeom from a centre/radius and the two endpoints on it. */
export function arcGeom(cx: number, cy: number, r: number, from: Point, to: Point): ArcGeom {
  const a1 = Math.atan2(from.y - cy, from.x - cx);
  const a2 = Math.atan2(to.y - cy, to.x - cx);
  let sweep = a2 - a1;
  while (sweep <= 1e-12) sweep += TAU;
  return { cx, cy, r, a1, a2, sweep };
}
