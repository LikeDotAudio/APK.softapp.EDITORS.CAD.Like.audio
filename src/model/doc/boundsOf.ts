// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { BBox } from '../../core/types';
import type { Doc } from '../Doc';

/** Bounding box of the given edges, or null when none of them exist. */
export function boundsOf(doc: Doc, edgeIds: Iterable<number>): BBox | null {
  let x1 = Infinity;
  let y1 = Infinity;
  let x2 = -Infinity;
  let y2 = -Infinity;
  let any = false;
  for (const id of edgeIds) {
    const e = doc.edges.get(id);
    if (!e) continue;
    any = true;
    const b = doc.edgeBBox(e);
    if (b.x1 < x1) x1 = b.x1;
    if (b.y1 < y1) y1 = b.y1;
    if (b.x2 > x2) x2 = b.x2;
    if (b.y2 > y2) y2 = b.y2;
  }
  return any ? { x1, y1, x2, y2 } : null;
}
