// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { TAU } from '../../core/constants';
import type { Point } from '../../core/types';
import { arcToPolyline } from '../../geometry/arc/arcToPolyline';
import type { Doc } from '../Doc';
import type { CycleWalk } from './cycleWalk';

/** Flatten a closed walk into a polygon, tessellating any arcs it contains. */
export function cyclePoints(doc: Doc, walk: CycleWalk): Point[] {
  const poly: Point[] = [];
  for (let i = 0; i < walk.edgeSeq.length; i++) {
    const startVid = walk.vertSeq[i]!;
    const startV = doc.vertexOf(startVid);
    poly.push({ x: startV.x, y: startV.y });

    const edge = doc.edge(walk.edgeSeq[i]!);
    if (!edge || edge.type !== 'arc') continue;

    const endV = doc.vertexOf(edge.v1 === startVid ? edge.v2 : edge.v1);
    const aFrom = Math.atan2(startV.y - edge.cy, startV.x - edge.cx);
    const aTo = Math.atan2(endV.y - edge.cy, endV.x - edge.cx);
    // The walk may traverse the arc against its stored CCW direction.
    const forward = edge.v1 === startVid;
    let sweep: number;
    if (forward) {
      sweep = aTo - aFrom;
      while (sweep <= 0) sweep += TAU;
    } else {
      let back = aFrom - aTo;
      while (back <= 0) back += TAU;
      sweep = -back;
    }
    poly.push(...arcToPolyline(edge.cx, edge.cy, edge.r, aFrom, sweep));
  }
  return poly;
}
