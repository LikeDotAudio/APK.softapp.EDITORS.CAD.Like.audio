// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { arcArcIntersect } from '../../geometry/intersect/arcArcIntersect';
import { lineArcIntersect } from '../../geometry/intersect/lineArcIntersect';
import { lineLineIntersect } from '../../geometry/intersect/lineLineIntersect';
import type { Doc } from '../Doc';
import { pushTo } from './pushTo';
import { sharesVertex } from './sharesVertex';

/**
 * Split every pair of crossing edges at their intersections so the drawing
 * stays a proper planar graph. Runs to a fixed point (splits can create new
 * crossings), capped at a handful of passes.
 */
export function resolveAllIntersections(doc: Doc): void {
  for (let pass = 0; pass < 8; pass++) {
    const ids = Array.from(doc.edges.keys());
    const lineSplits = new Map<number, number[]>();
    const arcSplits = new Map<number, number[]>();
    let found = false;

    for (let i = 0; i < ids.length; i++) {
      const ei = doc.edges.get(ids[i]!);
      if (!ei) continue;
      for (let j = i + 1; j < ids.length; j++) {
        const ej = doc.edges.get(ids[j]!);
        if (!ej) continue;
        if (sharesVertex(ei, ej)) continue;

        if (ei.type === 'line' && ej.type === 'line') {
          const [a1, a2] = doc.endpointsOf(ei);
          const [b1, b2] = doc.endpointsOf(ej);
          for (const h of lineLineIntersect(a1, a2, b1, b2)) {
            pushTo(lineSplits, ei.id, h.t);
            pushTo(lineSplits, ej.id, h.s);
            found = true;
          }
        } else if (ei.type === 'line' && ej.type === 'arc') {
          const [a1, a2] = doc.endpointsOf(ei);
          for (const h of lineArcIntersect(a1, a2, doc.arcOf(ej))) {
            pushTo(lineSplits, ei.id, h.t);
            pushTo(arcSplits, ej.id, h.s);
            found = true;
          }
        } else if (ei.type === 'arc' && ej.type === 'line') {
          const [b1, b2] = doc.endpointsOf(ej);
          for (const h of lineArcIntersect(b1, b2, doc.arcOf(ei))) {
            pushTo(lineSplits, ej.id, h.t);
            pushTo(arcSplits, ei.id, h.s);
            found = true;
          }
        } else if (ei.type === 'arc' && ej.type === 'arc') {
          for (const h of arcArcIntersect(doc.arcOf(ei), doc.arcOf(ej))) {
            pushTo(arcSplits, ei.id, h.s1);
            pushTo(arcSplits, ej.id, h.s2);
            found = true;
          }
        }
      }
    }

    for (const [eid, ts] of lineSplits) doc.splitLineAt(eid, ts);
    for (const [eid, ss] of arcSplits) doc.splitArcAt(eid, ss);
    if (!found) return;
  }
}
