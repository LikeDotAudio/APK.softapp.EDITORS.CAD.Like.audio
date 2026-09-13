// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { distToSegment } from '../../geometry/distToSegment';
import type { Doc } from '../Doc';

/** Cut an edge in two at the point nearest `(px, py)`. Returns the first new edge. */
export function divideEdge(doc: Doc, edgeId: number, px: number, py: number): number | null {
  const e = doc.edges.get(edgeId);
  if (!e) return null;
  const [a, b] = doc.endpointsOf(e);
  const layerId = e.layerId;

  if (e.type === 'line') {
    const d = distToSegment(px, py, a.x, a.y, b.x, b.y);
    const splitPt = { x: a.x + d * (b.x - a.x), y: a.y + d * (b.y - a.y) };
    doc.removeEdge(edgeId);
    const e1 = doc.addLine(a, splitPt, 0, layerId);
    doc.addLine(splitPt, b, 0, layerId);
    return e1;
  }

  const angle = Math.atan2(py - e.cy, px - e.cx);
  const splitPt = { x: e.cx + e.r * Math.cos(angle), y: e.cy + e.r * Math.sin(angle) };
  doc.removeEdge(edgeId);
  const e1 = doc.addArc(e.cx, e.cy, e.r, a, splitPt, 0, layerId);
  doc.addArc(e.cx, e.cy, e.r, splitPt, b, 0, layerId);
  return e1;
}
