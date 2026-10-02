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
    texts: Array.from(doc.texts.values(), (t) => ({ ...t })),
    fills: Array.from(doc.fills.values(), (f) => ({ ...f, points: f.points.map((p) => ({ ...p })) })),
    blocks: Array.from(doc.blocks.entries(), ([k, v]) => [k, JSON.parse(JSON.stringify(v))]),
    blockInstances: Array.from(doc.blockInstances.values(), (b) => ({ ...b })),
    nextVertexId: doc.nextVertexId,
    nextEdgeId: doc.nextEdgeId,
    nextGroupId: doc.nextGroupId,
    nextTextId: doc.nextTextId,
    nextFillId: doc.nextFillId,
    nextBlockInstanceId: doc.nextBlockInstanceId,
  };
}
