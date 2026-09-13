// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { LineEdge } from '../../core/types';
import type { Doc } from '../Doc';

/** Add a straight edge, reusing an identical one rather than duplicating it. */
export function addLineEdge(doc: Doc, v1: number, v2: number, groupId: number, layerId = '0'): number | null {
  if (v1 === v2) return null;
  for (const e of doc.edges.values()) {
    if (e.type === 'line' && ((e.v1 === v1 && e.v2 === v2) || (e.v1 === v2 && e.v2 === v1))) {
      return e.id;
    }
  }
  const id = doc.nextEdgeId++;
  const edge: LineEdge = { id, v1, v2, groupId, layerId, type: 'line' };
  doc.edges.set(id, edge);
  return id;
}
