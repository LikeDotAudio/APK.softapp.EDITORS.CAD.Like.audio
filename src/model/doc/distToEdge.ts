// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Edge } from '../../core/types';
import { arcDistance } from '../../geometry/arc/arcDistance';
import { distToSegment } from '../../geometry/distToSegment';
import type { Doc } from '../Doc';

/** World-space distance from a point to an edge. */
export function distToEdge(doc: Doc, wx: number, wy: number, e: Edge): number {
  const [a, b] = doc.endpointsOf(e);
  if (e.type === 'line') return distToSegment(wx, wy, a.x, a.y, b.x, b.y);
  return arcDistance(doc.arcOf(e), a, b, wx, wy);
}
