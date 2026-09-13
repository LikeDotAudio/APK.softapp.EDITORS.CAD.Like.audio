// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Point, ValidationResult } from '../../core/types';
import { bboxContains } from '../../geometry/polygon/bboxContains';
import { pointInPolygon } from '../../geometry/polygon/pointInPolygon';
import { polyBBox } from '../../geometry/polygon/polyBBox';
import type { Doc } from '../Doc';
import { connectedComponents } from '../topology/connectedComponents';
import { cyclePoints } from '../topology/cyclePoints';
import { cycleWalk } from '../topology/cycleWalk';

/**
 * A drawing is cuttable when every outline is a simple closed loop, there is
 * exactly one outer boundary, and nesting goes no deeper than outline → hole.
 */
export function validateGeometry(doc: Doc): ValidationResult {
  const errs: string[] = [];
  if (doc.isEmpty) return { valid: false, errs: ['No geometry to cut yet'] };

  let dangling = 0;
  let junctions = 0;
  for (const v of doc.vertices.values()) {
    const d = doc.vertexDegree(v.id);
    if (d === 1) dangling++;
    else if (d > 2) junctions++;
  }
  if (dangling > 0) errs.push(`${dangling} open endpoint${dangling > 1 ? 's' : ''} — close the shape`);
  if (junctions > 0) {
    errs.push(`${junctions} crossing${junctions > 1 ? 's' : ''} — delete the extra segments`);
  }
  if (errs.length) return { valid: false, errs };

  const cycles: Point[][] = [];
  for (const c of connectedComponents(doc)) {
    const walk = cycleWalk(doc, c);
    if (!walk) return { valid: false, errs: ['Shape is not a simple closed loop'] };
    cycles.push(cyclePoints(doc, walk));
  }

  if (cycles.length > 1) {
    // Depth = how many other cycles strictly contain this one.
    // 0 = outer boundary, 1 = hole, 2 = island inside a hole, …
    const boxes = cycles.map(polyBBox);
    const depth = new Array<number>(cycles.length).fill(0);
    for (let i = 0; i < cycles.length; i++) {
      for (let j = 0; j < cycles.length; j++) {
        if (i === j) continue;
        if (!bboxContains(boxes[j]!, boxes[i]!)) continue;
        const probe = cycles[i]![0]!;
        if (pointInPolygon(probe.x, probe.y, cycles[j]!)) depth[i]!++;
      }
    }
    const outers = depth.filter((d) => d === 0).length;
    if (outers !== 1) {
      errs.push(`${outers} separate parts — draw one part at a time`);
    } else {
      const maxDepth = Math.max(...depth);
      if (maxDepth >= 2) errs.push(`Nested too deep (${maxDepth + 1} layers) — remove innermost shape`);
    }
  }

  return { valid: errs.length === 0, errs };
}
