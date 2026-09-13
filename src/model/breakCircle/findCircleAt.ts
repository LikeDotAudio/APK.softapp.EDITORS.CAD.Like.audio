// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { CirclePrimitive } from '../../core/types';
import type { Doc } from '../Doc';

/** An intact circle group, identified by one of its arcs. */
export interface CircleTarget {
  groupId: number;
  prim: CirclePrimitive;
}

/** Find an intact circle under the cursor, by way of one of its arc edges. */
export function findCircleAt(doc: Doc, wx: number, wy: number, zoom: number): CircleTarget | null {
  const id = doc.hitEdgeAt(wx, wy, zoom, 10);
  if (id === null) return null;
  const e = doc.edge(id);
  if (!e || e.type !== 'arc') return null;
  const prim = doc.groupPrimitives.get(e.groupId);
  if (!prim || prim.type !== 'circle') return null;
  return { groupId: e.groupId, prim };
}
