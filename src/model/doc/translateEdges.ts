// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Doc } from '../Doc';
import { affectedByEdges } from './affectedByEdges';

/** Translate selected edges by (dx, dy). */
export function translateEdges(doc: Doc, edgeIds: Iterable<number>, dx: number, dy: number): boolean {
  const edgeSet = new Set(edgeIds);
  if (edgeSet.size === 0 || (dx === 0 && dy === 0)) return false;

  const affected = affectedByEdges(doc, edgeSet);

  for (const vId of affected.vertices) {
    const v = doc.vertices.get(vId);
    if (v) {
      v.x += dx;
      v.y += dy;
    }
  }

  for (const id of edgeSet) {
    const e = doc.edges.get(id);
    if (e && e.type === 'arc') {
      e.cx += dx;
      e.cy += dy;
    }
  }

  for (const gId of affected.groups) {
    const p = doc.groupPrimitives.get(gId);
    if (p) {
      p.cx += dx;
      p.cy += dy;
    }
  }

  doc.resolveAllIntersections();
  return true;
}
