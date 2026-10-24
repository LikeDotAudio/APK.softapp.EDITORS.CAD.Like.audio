// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Point } from '../../core/types';
import { pointInPolygon } from '../../geometry/polygon/pointInPolygon';
import type { Doc } from '../Doc';
import { connectedComponents } from '../topology/connectedComponents';
import { cyclePoints } from '../topology/cyclePoints';
import { cycleWalk } from '../topology/cycleWalk';

function area(poly: Point[]): number {
  let a = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    a += (poly[j]!.x + poly[i]!.x) * (poly[j]!.y - poly[i]!.y);
  }
  return Math.abs(a / 2);
}

/**
 * The closed outline on `layerId` that a click at `p` is inside, as a polygon
 * — the smallest one, so a click in a window drawn on a wall finds the window,
 * not the wall around it. Only simple loops count (the same rule the host's
 * rooms follow); a branched network has no single "inside" to fill.
 */
export function closedLoopAt(doc: Doc, p: Point, layerId: string): Point[] | null {
  let best: Point[] | null = null;
  let bestArea = Infinity;
  for (const comp of connectedComponents(doc)) {
    const walk = cycleWalk(doc, comp);
    if (!walk) continue;
    if (doc.edge(walk.edgeSeq[0]!)?.layerId !== layerId) continue;
    const poly = cyclePoints(doc, walk);
    if (poly.length < 3 || !pointInPolygon(p.x, p.y, poly)) continue;
    const a = area(poly);
    if (a < bestArea) {
      best = poly;
      bestArea = a;
    }
  }
  return best;
}
