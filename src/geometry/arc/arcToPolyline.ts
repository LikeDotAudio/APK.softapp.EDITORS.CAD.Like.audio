// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Point } from '../../core/types';

/** Flatten an arc into a polyline, excluding the final point. */
export function arcToPolyline(
  cx: number,
  cy: number,
  r: number,
  aFrom: number,
  sweep: number,
  maxStep = Math.PI / 8,
): Point[] {
  const steps = Math.max(6, Math.ceil(Math.abs(sweep) / maxStep));
  const out: Point[] = [];
  for (let j = 1; j < steps; j++) {
    const a = aFrom + sweep * (j / steps);
    out.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  }
  return out;
}
