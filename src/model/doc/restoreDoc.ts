// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Doc } from '../Doc';
import type { DocSnapshot } from './DocSnapshot';

/** Replace the document's contents with a snapshot. */
export function restoreDoc(doc: Doc, s: DocSnapshot): void {
  doc.vertices = new Map(s.vertices.map((v) => [v.id, { ...v }]));
  doc.edges = new Map(s.edges.map((e) => [e.id, { ...e }]));
  doc.groupPrimitives = new Map(s.groupPrimitives.map(([k, v]) => [k, { ...v }]));
  doc.groupIntact = new Set(s.groupIntact);
  doc.nextVertexId = s.nextVertexId;
  doc.nextEdgeId = s.nextEdgeId;
  doc.nextGroupId = s.nextGroupId;
}
