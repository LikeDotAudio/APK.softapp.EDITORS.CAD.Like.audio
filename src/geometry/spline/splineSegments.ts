// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Point } from '../../core/types';

/** One cubic Bézier span of a Catmull-Rom-ish smooth curve through the points. */
export interface SplineSegment {
  from: Point;
  cp1: Point;
  cp2: Point;
  to: Point;
}

/**
 * Convert control points into cubic Bézier spans. The tangent at each point is
 * one sixth of the vector between its neighbours, which is the classic
 * Catmull-Rom → Bézier conversion.
 */
export function splineSegments(pts: Point[], closed: boolean): SplineSegment[] {
  const n = pts.length;
  if (n < 2) return [];
  const p = closed ? [pts[n - 1]!, ...pts, pts[0]!, pts[1]!] : [pts[0]!, ...pts, pts[n - 1]!];
  const count = closed ? n : n - 1;
  const out: SplineSegment[] = [];
  for (let i = 0; i < count; i++) {
    const p0 = p[i]!;
    const p1 = p[i + 1]!;
    const p2 = p[i + 2]!;
    const p3 = p[i + 3]!;
    out.push({
      from: p1,
      cp1: { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 },
      cp2: { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 },
      to: p2,
    });
  }
  return out;
}
