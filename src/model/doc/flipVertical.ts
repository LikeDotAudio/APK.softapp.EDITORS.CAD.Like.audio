// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Doc } from '../Doc';
import { affectedByEdges } from './affectedByEdges';

/** Mirror selected edges across the horizontal centreline of their own bounds. */
export function flipVertical(doc: Doc, edgeIds: Iterable<number>): boolean {
  const edgeSet = new Set(edgeIds);
  if (edgeSet.size === 0) return false;

  const b = doc.boundsOf(edgeSet);
  if (!b) return false;
  const cy = (b.y1 + b.y2) / 2;

  const affected = affectedByEdges(doc, edgeSet);
  for (const vId of affected.vertices) {
    const v = doc.vertices.get(vId);
    if (v) v.y = cy - (v.y - cy);
  }

  for (const id of edgeSet) {
    const e = doc.edges.get(id);
    if (e && e.type === 'arc') e.cy = cy - (e.cy - cy);
  }

  doc.resolveAllIntersections();
  return true;
}
