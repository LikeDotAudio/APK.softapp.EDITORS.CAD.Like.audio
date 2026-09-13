// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Doc } from '../Doc';

/** Vertices and groups a bulk transform will touch, marking those groups dirty. */
export interface Affected {
  vertices: Set<number>;
  groups: Set<number>;
}

export function affectedByEdges(doc: Doc, edgeSet: Set<number>): Affected {
  const vertices = new Set<number>();
  const groups = new Set<number>();
  for (const id of edgeSet) {
    const e = doc.edges.get(id);
    if (!e) continue;
    vertices.add(e.v1);
    vertices.add(e.v2);
    if (e.groupId) {
      groups.add(e.groupId);
      // Any transform means the group no longer matches its construction primitive.
      doc.groupIntact.delete(e.groupId);
    }
  }
  return { vertices, groups };
}
