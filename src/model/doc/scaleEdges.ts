// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Doc } from '../Doc';
import { affectedByEdges } from './affectedByEdges';

/** Scale selected edges uniformly about `(cx, cy)`. */
export function scaleEdges(doc: Doc, edgeIds: Iterable<number>, cx: number, cy: number, scaleFactor: number): boolean {
  if (scaleFactor <= 0) return false;
  const edgeSet = new Set(edgeIds);
  if (edgeSet.size === 0) return false;

  const affected = affectedByEdges(doc, edgeSet);

  for (const vId of affected.vertices) {
    const v = doc.vertices.get(vId);
    if (v) {
      v.x = cx + (v.x - cx) * scaleFactor;
      v.y = cy + (v.y - cy) * scaleFactor;
    }
  }

  for (const id of edgeSet) {
    const e = doc.edges.get(id);
    if (e && e.type === 'arc') {
      e.cx = cx + (e.cx - cx) * scaleFactor;
      e.cy = cy + (e.cy - cy) * scaleFactor;
      e.r *= scaleFactor;
    }
  }

  doc.resolveAllIntersections();
  return true;
}
