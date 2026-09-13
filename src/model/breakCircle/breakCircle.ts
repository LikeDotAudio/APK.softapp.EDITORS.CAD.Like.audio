// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { TAU } from '../../core/constants';
import { arcMidpoint } from '../../geometry/arc/arcMidpoint';
import { arcParamFor } from '../../geometry/arc/arcParamFor';
import type { Doc } from '../Doc';

/**
 * Remove the CCW section of a circle between two angles. The circle's arcs are
 * split at both angles and the pieces inside the swept section are deleted, so
 * what remains is still true arcs rather than a polyline approximation.
 */
export function breakCircle(doc: Doc, groupId: number, startAngle: number, endAngle: number): boolean {
  const prim = doc.groupPrimitives.get(groupId);
  if (!prim) return false;

  let sweep = endAngle - startAngle;
  while (sweep <= 0) sweep += TAU;
  if (sweep < 1e-6 || sweep > TAU - 1e-6) return false;

  doc.groupIntact.delete(groupId);

  const arcIds: number[] = [];
  for (const e of doc.edges.values()) if (e.groupId === groupId && e.type === 'arc') arcIds.push(e.id);

  for (const eid of arcIds) {
    const e = doc.edge(eid);
    if (!e || e.type !== 'arc') continue;
    const g = doc.arcOf(e);
    const params: number[] = [];
    for (const ang of [startAngle, endAngle]) {
      const px = prim.cx + prim.r * Math.cos(ang);
      const py = prim.cy + prim.r * Math.sin(ang);
      const s = arcParamFor(g, px, py);
      if (s !== null && s > 1e-6 && s < 1 - 1e-6) params.push(s);
    }
    if (params.length) doc.splitArcAt(eid, params);
  }

  const doomed: number[] = [];
  for (const e of doc.edges.values()) {
    if (e.groupId !== groupId || e.type !== 'arc') continue;
    const m = arcMidpoint(doc.arcOf(e));
    const ang = Math.atan2(m.y - prim.cy, m.x - prim.cx);
    let delta = ang - startAngle;
    while (delta < 0) delta += TAU;
    while (delta >= TAU) delta -= TAU;
    if (delta > 1e-6 && delta < sweep - 1e-6) doomed.push(e.id);
  }
  for (const id of doomed) doc.removeEdge(id);
  return true;
}
