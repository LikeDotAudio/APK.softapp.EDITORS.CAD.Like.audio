// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { EPS } from '../../core/constants';
import type { ArcEdge } from '../../core/types';
import type { Doc } from '../Doc';

/** Add a true-arc edge, reusing an identical one rather than duplicating it. */
export function addArcEdge(
  doc: Doc,
  v1: number,
  v2: number,
  cx: number,
  cy: number,
  r: number,
  groupId: number,
  layerId = '0',
): number | null {
  if (v1 === v2) return null;
  for (const e of doc.edges.values()) {
    if (
      e.type === 'arc' &&
      e.v1 === v1 &&
      e.v2 === v2 &&
      Math.abs(e.cx - cx) < EPS &&
      Math.abs(e.cy - cy) < EPS &&
      Math.abs(e.r - r) < EPS * 10
    ) {
      return e.id;
    }
  }
  const id = doc.nextEdgeId++;
  const edge: ArcEdge = { id, v1, v2, groupId, layerId, type: 'arc', cx, cy, r };
  doc.edges.set(id, edge);
  return id;
}
