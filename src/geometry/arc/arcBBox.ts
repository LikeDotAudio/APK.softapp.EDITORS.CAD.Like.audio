// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { TAU } from '../../core/constants';
import type { BBox, Point } from '../../core/types';
import type { ArcGeom } from './arcGeom';

/** True bounding box, including any axis extremes the sweep passes through. */
export function arcBBox(g: ArcGeom, from: Point, to: Point): BBox {
  let x1 = Math.min(from.x, to.x);
  let y1 = Math.min(from.y, to.y);
  let x2 = Math.max(from.x, to.x);
  let y2 = Math.max(from.y, to.y);
  for (const c of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
    let d = c - g.a1;
    while (d < 0) d += TAU;
    while (d >= TAU) d -= TAU;
    if (d <= g.sweep) {
      const px = g.cx + g.r * Math.cos(c);
      const py = g.cy + g.r * Math.sin(c);
      if (px < x1) x1 = px;
      if (py < y1) y1 = py;
      if (px > x2) x2 = px;
      if (py > y2) y2 = py;
    }
  }
  return { x1, y1, x2, y2 };
}
