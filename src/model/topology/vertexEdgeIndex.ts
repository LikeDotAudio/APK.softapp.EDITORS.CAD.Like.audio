// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Edge } from '../../core/types';
import type { Doc } from '../Doc';

/** vertex id → the edges touching it. */
export function vertexEdgeIndex(doc: Doc, edgeIds?: Iterable<number>): Map<number, Edge[]> {
  const index = new Map<number, Edge[]>();
  const add = (v: number, e: Edge) => {
    const list = index.get(v);
    if (list) list.push(e);
    else index.set(v, [e]);
  };
  if (edgeIds) {
    for (const id of edgeIds) {
      const e = doc.edge(id);
      if (!e) continue;
      add(e.v1, e);
      add(e.v2, e);
    }
  } else {
    for (const e of doc.edges.values()) {
      add(e.v1, e);
      add(e.v2, e);
    }
  }
  return index;
}
