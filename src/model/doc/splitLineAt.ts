// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Doc } from '../Doc';

/** Split a line edge at the given parametric positions; returns the new edge ids. */
export function splitLineAt(doc: Doc, edgeId: number, ts: number[]): number[] {
  const e = doc.edges.get(edgeId);
  if (!e || e.type !== 'line') return [];
  if (!ts.length) return [edgeId];
  if (e.groupId) doc.groupIntact.delete(e.groupId);
  const [a, b] = doc.endpointsOf(e);
  const sorted = [...ts].sort((x, y) => x - y);
  const vIds = [e.v1];
  for (const t of sorted) vIds.push(doc.addVertex(a.x + t * (b.x - a.x), a.y + t * (b.y - a.y)));
  vIds.push(e.v2);
  doc.edges.delete(edgeId);
  const out: number[] = [];
  for (let i = 0; i < vIds.length - 1; i++) {
    const from = vIds[i]!;
    const to = vIds[i + 1]!;
    if (from !== to) {
      const n = doc.addLineEdge(from, to, e.groupId, e.layerId);
      if (n) out.push(n);
    }
  }
  return out;
}
