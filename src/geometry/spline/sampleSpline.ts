// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Point } from '../../core/types';
import { splineSegments } from './splineSegments';

/** Flatten a spline into a polyline with `samples` points per span. */
export function sampleSpline(pts: Point[], closed: boolean, samples = 24): Point[] {
  const segs = splineSegments(pts, closed);
  const out: Point[] = [];
  for (const s of segs) {
    for (let i = 0; i < samples; i++) {
      const t = i / samples;
      const mt = 1 - t;
      out.push({
        x: mt * mt * mt * s.from.x + 3 * mt * mt * t * s.cp1.x + 3 * mt * t * t * s.cp2.x + t * t * t * s.to.x,
        y: mt * mt * mt * s.from.y + 3 * mt * mt * t * s.cp1.y + 3 * mt * t * t * s.cp2.y + t * t * t * s.to.y,
      });
    }
  }
  if (!closed && pts.length) {
    const last = pts[pts.length - 1]!;
    out.push({ x: last.x, y: last.y });
  }
  return out;
}
