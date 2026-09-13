// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { EPS } from '../../core/constants';
import type { Doc } from '../Doc';

/** Four lines sharing one group id, so the rectangle selects as one shape. */
export function commitRect(doc: Doc, x1: number, y1: number, x2: number, y2: number, layerId = '0'): boolean {
  const lx = Math.min(x1, x2);
  const ly = Math.min(y1, y2);
  const hx = Math.max(x1, x2);
  const hy = Math.max(y1, y2);
  if (hx - lx < EPS && hy - ly < EPS) return false;
  const g = doc.newGroupId();
  const a = doc.addVertex(lx, ly);
  const b = doc.addVertex(hx, ly);
  const c = doc.addVertex(hx, hy);
  const d = doc.addVertex(lx, hy);
  doc.addLineEdge(a, b, g, layerId);
  doc.addLineEdge(b, c, g, layerId);
  doc.addLineEdge(c, d, g, layerId);
  doc.addLineEdge(d, a, g, layerId);
  doc.resolveAllIntersections();
  return true;
}
