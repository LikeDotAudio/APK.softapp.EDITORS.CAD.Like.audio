// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { BBox, Edge } from '../../core/types';
import { arcBBox } from '../../geometry/arc/arcBBox';
import type { Doc } from '../Doc';

/** Bounding box of one edge, including an arc's bulge. */
export function edgeBBox(doc: Doc, e: Edge): BBox {
  const [a, b] = doc.endpointsOf(e);
  if (e.type === 'arc') return arcBBox(doc.arcOf(e), a, b);
  return {
    x1: Math.min(a.x, b.x),
    y1: Math.min(a.y, b.y),
    x2: Math.max(a.x, b.x),
    y2: Math.max(a.y, b.y),
  };
}
