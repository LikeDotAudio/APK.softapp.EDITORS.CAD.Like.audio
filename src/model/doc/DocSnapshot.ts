// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { CadBlockDefinition, CadBlockInstance, Edge, FillEntity, GroupPrimitive, TextEntity, Vertex } from '../../core/types';

/** A deep copy of the document, cheap enough to push on every edit. */
export interface DocSnapshot {
  vertices: Vertex[];
  edges: Edge[];
  groupPrimitives: [number, GroupPrimitive][];
  groupIntact: number[];
  texts?: TextEntity[];
  fills?: FillEntity[];
  blocks?: [string, CadBlockDefinition][];
  blockInstances?: CadBlockInstance[];
  nextVertexId: number;
  nextEdgeId: number;
  nextGroupId: number;
  nextTextId?: number;
  nextFillId?: number;
  nextBlockInstanceId?: number;
}
