// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Doc } from '../Doc';
import { translateEdges } from './translateEdges';

/**
 * Translate whatever is in `ids`:
 * - Edges and connected vertices/groups
 * - Text annotations (x += dx, y += dy)
 * - Block instances (x += dx, y += dy)
 */
export function translateSelection(
  doc: Doc,
  ids: Iterable<number>,
  dx: number,
  dy: number,
): boolean {
  const idSet = new Set(ids);
  if (idSet.size === 0 || (dx === 0 && dy === 0)) return false;

  const edgeIds: number[] = [];
  let movedOther = false;

  for (const id of idSet) {
    if (doc.edges.has(id)) {
      edgeIds.push(id);
    } else {
      const text = doc.texts.get(id);
      if (text && !text.protected) {
        text.x += dx;
        text.y += dy;
        movedOther = true;
      }

      const inst = doc.blockInstances.get(id);
      if (inst && !inst.protected) {
        inst.x += dx;
        inst.y += dy;
        movedOther = true;
      }
    }
  }

  let movedEdges = false;
  if (edgeIds.length > 0) {
    movedEdges = translateEdges(doc, edgeIds, dx, dy);
  }

  return movedEdges || movedOther;
}
