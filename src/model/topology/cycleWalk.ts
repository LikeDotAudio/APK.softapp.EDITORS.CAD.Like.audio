// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Edge } from '../../core/types';
import type { Doc } from '../Doc';
import type { Component } from './connectedComponents';
import { vertexEdgeIndex } from './vertexEdgeIndex';

/** A closed loop expressed as parallel edge and vertex sequences. */
export interface CycleWalk {
  edgeSeq: number[];
  vertSeq: number[];
}

/**
 * Walk a component as a single closed loop. Returns null when the component
 * is not one — a dangling end or a branch point both break the walk.
 */
export function cycleWalk(doc: Doc, component: Component): CycleWalk | null {
  const index = vertexEdgeIndex(doc, component.edgeIds);
  const startV = component.verts[0];
  if (startV === undefined) return null;
  if (index.get(startV)?.length !== 2) return null;

  let prev: number | null = null;
  let curV = startV;
  const edgeSeq: number[] = [];
  const vertSeq: number[] = [startV];

  for (;;) {
    const nbrs = index.get(curV);
    if (!nbrs || nbrs.length !== 2) return null;
    // Annotated to break the circular inference between `prev` and `next`.
    const next: Edge = nbrs[0]!.id === prev ? nbrs[1]! : nbrs[0]!;
    edgeSeq.push(next.id);
    const nextV = next.v1 === curV ? next.v2 : next.v1;
    if (nextV === startV) break;
    vertSeq.push(nextV);
    prev = next.id;
    curV = nextV;
    if (edgeSeq.length > doc.edgeCount + 5) return null;
  }
  return { edgeSeq, vertSeq };
}
