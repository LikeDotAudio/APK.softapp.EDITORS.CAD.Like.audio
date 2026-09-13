// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Edge, Point } from '../../core/types';
import { arcMidpoint } from '../../geometry/arc/arcMidpoint';
import type { Doc } from '../Doc';

/** Midpoint of an edge — along the arc for arcs, not the chord. */
export function edgeMidpoint(doc: Doc, e: Edge): Point {
  if (e.type === 'arc') return arcMidpoint(doc.arcOf(e));
  const [a, b] = doc.endpointsOf(e);
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}
