// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Point } from '../../core/types';
import type { Doc } from '../Doc';

/** Connected run of lines, optionally closed back to the first point. */
export function commitPolyline(doc: Doc, pts: Point[], closed: boolean, layerId = '0'): boolean {
  if (pts.length < 2) return false;
  const g = doc.newGroupId();
  const vs = pts.map((p) => doc.addVertex(p.x, p.y));
  for (let i = 0; i < vs.length - 1; i++) doc.addLineEdge(vs[i]!, vs[i + 1]!, g, layerId);
  if (closed) doc.addLineEdge(vs[vs.length - 1]!, vs[0]!, g, layerId);
  doc.resolveAllIntersections();
  return true;
}
