// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Edge, GroupPrimitive, Vertex } from '../../core/types';

/** A deep copy of the document, cheap enough to push on every edit. */
export interface DocSnapshot {
  vertices: Vertex[];
  edges: Edge[];
  groupPrimitives: [number, GroupPrimitive][];
  groupIntact: number[];
  nextVertexId: number;
  nextEdgeId: number;
  nextGroupId: number;
}
