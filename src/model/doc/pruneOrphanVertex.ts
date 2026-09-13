// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Doc } from '../Doc';

/** Drop a vertex once nothing references it. */
export function pruneOrphanVertex(doc: Doc, vId: number): void {
  for (const e of doc.edges.values()) if (e.v1 === vId || e.v2 === vId) return;
  doc.vertices.delete(vId);
}
