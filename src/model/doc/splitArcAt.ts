// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { arcPointAt } from '../../geometry/arc/arcPointAt';
import type { Doc } from '../Doc';

/** Split an arc edge at the given parametric positions; returns the new edge ids. */
export function splitArcAt(doc: Doc, edgeId: number, ss: number[]): number[] {
  const e = doc.edges.get(edgeId);
  if (!e || e.type !== 'arc') return [];
  if (!ss.length) return [edgeId];
  if (e.groupId) doc.groupIntact.delete(e.groupId);
  const g = doc.arcOf(e);
  const sorted = [...ss].sort((x, y) => x - y);
  const vIds = [e.v1];
  for (const s of sorted) {
    const p = arcPointAt(g, s);
    vIds.push(doc.addVertex(p.x, p.y));
  }
  vIds.push(e.v2);
  doc.edges.delete(edgeId);
  const out: number[] = [];
  for (let i = 0; i < vIds.length - 1; i++) {
    const from = vIds[i]!;
    const to = vIds[i + 1]!;
    if (from !== to) {
      const n = doc.addArcEdge(from, to, e.cx, e.cy, e.r, e.groupId, e.layerId);
      if (n) out.push(n);
    }
  }
  return out;
}
