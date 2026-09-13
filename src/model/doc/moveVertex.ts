// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Doc } from '../Doc';

/**
 * Drop a single vertex at a new position. Every edge that references it follows,
 * which is what makes an endpoint grip stretch the line rather than detach it.
 *
 * Deliberately does not re-planarise — a grip drag would otherwise split edges
 * on every mouse move and churn the ids being dragged. Call
 * `resolveAllIntersections()` once when the drag ends.
 */
export function moveVertex(doc: Doc, vId: number, x: number, y: number): boolean {
  const v = doc.vertices.get(vId);
  if (!v) return false;
  if (v.x === x && v.y === y) return false;

  v.x = x;
  v.y = y;

  // The shape no longer matches whatever primitive drew it.
  for (const e of doc.edges.values()) {
    if ((e.v1 === vId || e.v2 === vId) && e.groupId) doc.groupIntact.delete(e.groupId);
  }
  return true;
}
