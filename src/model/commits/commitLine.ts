// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { EPS } from '../../core/constants';
import type { Doc } from '../Doc';

/** Returns true when the drawing actually changed, so callers can skip empty undo entries. */
export function commitLine(doc: Doc, x1: number, y1: number, x2: number, y2: number, layerId = '0'): boolean {
  if (Math.hypot(x2 - x1, y2 - y1) < EPS) return false;
  const g = doc.newGroupId();
  doc.addLineEdge(doc.addVertex(x1, y1), doc.addVertex(x2, y2), g, layerId);
  doc.resolveAllIntersections();
  return true;
}
