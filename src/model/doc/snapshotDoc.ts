// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Doc } from '../Doc';
import type { DocSnapshot } from './DocSnapshot';

/** Deep copy for the undo stack. */
export function snapshotDoc(doc: Doc): DocSnapshot {
  return {
    vertices: Array.from(doc.vertices.values(), (v) => ({ ...v })),
    edges: Array.from(doc.edges.values(), (e) => ({ ...e })),
    groupPrimitives: Array.from(doc.groupPrimitives.entries(), ([k, v]) => [k, { ...v }]),
    groupIntact: Array.from(doc.groupIntact),
    nextVertexId: doc.nextVertexId,
    nextEdgeId: doc.nextEdgeId,
    nextGroupId: doc.nextGroupId,
  };
}
