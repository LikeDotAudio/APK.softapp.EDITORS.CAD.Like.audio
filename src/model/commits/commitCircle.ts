// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { EPS } from '../../core/constants';
import type { Doc } from '../Doc';

/**
 * A circle is stored as two half-arcs sharing the leftmost and rightmost
 * points. Keeping it as true arcs is what lets a cut circle stay curved, and
 * the recorded primitive lets an untouched one export as a DXF CIRCLE.
 */
export function commitCircle(doc: Doc, cx: number, cy: number, r: number, layerId = '0'): boolean {
  if (r < EPS) return false;
  const g = doc.newGroupId();
  const vRight = doc.addVertex(cx + r, cy);
  const vLeft = doc.addVertex(cx - r, cy);
  doc.addArcEdge(vRight, vLeft, cx, cy, r, g, layerId); // top half, CCW
  doc.addArcEdge(vLeft, vRight, cx, cy, r, g, layerId); // bottom half, CCW
  doc.groupPrimitives.set(g, { type: 'circle', cx, cy, r });
  doc.groupIntact.add(g);
  doc.resolveAllIntersections();
  return true;
}
