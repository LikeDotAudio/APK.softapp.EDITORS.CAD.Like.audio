// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Doc } from '../Doc';
import { unweldEdges } from './unweldEdges';

/**
 * Break a shape into independent segments: drop group membership, then unweld
 * the shared vertices so each piece selects, moves and deletes on its own.
 *
 * Returns how many pieces the selection now consists of.
 */
export function explodeSelected(doc: Doc, edgeIds: Iterable<number>): number {
  const edgeSet = new Set(edgeIds);
  let pieces = 0;

  for (const id of edgeSet) {
    const e = doc.edges.get(id);
    if (!e) continue;
    pieces++;
    if (e.groupId) {
      doc.groupIntact.delete(e.groupId);
      e.groupId = 0;
    }
  }

  // Unwelding reports only the edges it had to detach — a chain of three needs
  // two detachments to become three pieces — so the piece count comes from above.
  unweldEdges(doc, edgeSet);
  return pieces;
}
