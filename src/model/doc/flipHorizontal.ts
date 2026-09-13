// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Doc } from '../Doc';
import { affectedByEdges } from './affectedByEdges';

/** Mirror selected edges across the vertical centreline of their own bounds. */
export function flipHorizontal(doc: Doc, edgeIds: Iterable<number>): boolean {
  const edgeSet = new Set(edgeIds);
  if (edgeSet.size === 0) return false;

  const b = doc.boundsOf(edgeSet);
  if (!b) return false;
  const cx = (b.x1 + b.x2) / 2;

  const affected = affectedByEdges(doc, edgeSet);
  for (const vId of affected.vertices) {
    const v = doc.vertices.get(vId);
    if (v) v.x = cx - (v.x - cx);
  }

  for (const id of edgeSet) {
    const e = doc.edges.get(id);
    if (e && e.type === 'arc') e.cx = cx - (e.cx - cx);
  }

  doc.resolveAllIntersections();
  return true;
}
