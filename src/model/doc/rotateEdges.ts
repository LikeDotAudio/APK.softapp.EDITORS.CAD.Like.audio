// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Doc } from '../Doc';
import { affectedByEdges } from './affectedByEdges';

/** Rotate a set of edges by `angleRad` about pivot `(cx, cy)`. */
export function rotateEdges(doc: Doc, edgeIds: Iterable<number>, cx: number, cy: number, angleRad: number): boolean {
  const edgeSet = new Set(edgeIds);
  if (!edgeSet.size || Math.abs(angleRad) < 1e-9) return false;

  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const affected = affectedByEdges(doc, edgeSet);

  for (const vId of affected.vertices) {
    const v = doc.vertices.get(vId);
    if (!v) continue;
    const dx = v.x - cx;
    const dy = v.y - cy;
    v.x = cx + dx * cos - dy * sin;
    v.y = cy + dx * sin + dy * cos;
  }

  for (const id of edgeSet) {
    const e = doc.edges.get(id);
    if (e && e.type === 'arc') {
      const dx = e.cx - cx;
      const dy = e.cy - cy;
      e.cx = cx + dx * cos - dy * sin;
      e.cy = cy + dx * sin + dy * cos;
    }
  }

  for (const gId of affected.groups) {
    const p = doc.groupPrimitives.get(gId);
    if (p) {
      const dx = p.cx - cx;
      const dy = p.cy - cy;
      p.cx = cx + dx * cos - dy * sin;
      p.cy = cy + dx * sin + dy * cos;
    }
  }

  doc.resolveAllIntersections();
  return true;
}
