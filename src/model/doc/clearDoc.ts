// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Doc } from '../Doc';

/** Empty the document and reset every id counter. */
export function clearDoc(doc: Doc): void {
  doc.vertices.clear();
  doc.edges.clear();
  doc.groupPrimitives.clear();
  doc.groupIntact.clear();
  doc.nextVertexId = 1;
  doc.nextEdgeId = 1;
  doc.nextGroupId = 1;
}
