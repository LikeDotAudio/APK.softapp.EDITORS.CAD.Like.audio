// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Doc } from '../Doc';

/** Put every selected edge in one new group. Returns how many were regrouped. */
export function groupSelected(doc: Doc, edgeIds: Iterable<number>): number {
  const edgeSet = new Set(edgeIds);
  if (edgeSet.size <= 1) return 0;
  const newGroupId = doc.newGroupId();
  let count = 0;
  for (const id of edgeSet) {
    const e = doc.edges.get(id);
    if (e) {
      e.groupId = newGroupId;
      count++;
    }
  }
  return count;
}
