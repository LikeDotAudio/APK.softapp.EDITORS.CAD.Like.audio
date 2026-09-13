// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Doc } from '../Doc';

/** Multiply every coordinate by `f` (unit switches and scale calibration). */
export function scaleAll(doc: Doc, f: number): void {
  for (const v of doc.vertices.values()) {
    v.x *= f;
    v.y *= f;
  }
  for (const e of doc.edges.values()) {
    if (e.type === 'arc') {
      e.cx *= f;
      e.cy *= f;
      e.r *= f;
    }
  }
  for (const p of doc.groupPrimitives.values()) {
    p.cx *= f;
    p.cy *= f;
    p.r *= f;
  }
}
