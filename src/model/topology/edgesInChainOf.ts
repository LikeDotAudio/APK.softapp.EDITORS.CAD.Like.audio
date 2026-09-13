// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Edge } from '../../core/types';
import type { Doc } from '../Doc';
import { vertexEdgeIndex } from './vertexEdgeIndex';

/**
 * All edges reachable from `edgeId` by walking through degree-2 vertices —
 * i.e. the continuous run of segments a user perceives as one outline. The
 * walk stops at branches so a T-junction doesn't drag in unrelated geometry.
 */
export function edgesInChainOf(doc: Doc, edgeId: number): Set<number> {
  const start = doc.edge(edgeId);
  if (!start) return new Set();
  const result = new Set([edgeId]);
  const index = vertexEdgeIndex(doc);

  const walk = (fromV: number, viaEdge: Edge) => {
    let prev = viaEdge.id;
    let cur = fromV;
    for (;;) {
      const es = index.get(cur) ?? [];
      if (es.length !== 2) return;
      const next = es[0]!.id === prev ? es[1]! : es[0]!;
      if (result.has(next.id)) return;
      result.add(next.id);
      prev = next.id;
      cur = next.v1 === cur ? next.v2 : next.v1;
    }
  };

  walk(start.v1, start);
  walk(start.v2, start);
  return result;
}
