// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Doc } from '../Doc';

/**
 * Give each edge its own copy of any vertex it shares with another edge.
 *
 * Selection and dragging both walk the vertex graph, so segments that share a
 * vertex behave as one outline no matter what their group id says. Unwelding is
 * what actually breaks a chain into pieces you can select and move separately.
 * The pieces stay exactly where they are — only the graph changes.
 */
export function unweldEdges(doc: Doc, edgeIds: Iterable<number>): number {
  const edgeSet = new Set(edgeIds);
  let separated = 0;

  for (const id of edgeSet) {
    const e = doc.edges.get(id);
    if (!e) continue;
    let changed = false;

    for (const key of ['v1', 'v2'] as const) {
      const vId = e[key];
      let shared = false;
      for (const other of doc.edges.values()) {
        if (other.id !== e.id && (other.v1 === vId || other.v2 === vId)) {
          shared = true;
          break;
        }
      }
      if (!shared) continue;

      const v = doc.vertices.get(vId);
      if (!v) continue;
      // Inserted directly rather than through addVertex, which would merge it
      // straight back into the coincident vertex we are splitting away from.
      const newId = doc.nextVertexId++;
      doc.vertices.set(newId, { id: newId, x: v.x, y: v.y });
      e[key] = newId;
      changed = true;
    }

    if (changed) separated++;
  }

  return separated;
}
