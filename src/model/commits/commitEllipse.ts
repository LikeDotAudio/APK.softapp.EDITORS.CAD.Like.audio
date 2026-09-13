// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { EPS, TAU } from '../../core/constants';
import type { Doc } from '../Doc';

/** Ellipses have no true-arc representation here, so they are flattened. */
export function commitEllipse(
  doc: Doc,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  segments = 96,
  layerId = '0',
): boolean {
  if (rx < EPS && ry < EPS) return false;
  const g = doc.newGroupId();
  const vs: number[] = [];
  for (let i = 0; i < segments; i++) {
    const a = (TAU * i) / segments;
    vs.push(doc.addVertex(cx + rx * Math.cos(a), cy + ry * Math.sin(a)));
  }
  for (let i = 0; i < segments; i++) doc.addLineEdge(vs[i]!, vs[(i + 1) % segments]!, g, layerId);
  doc.resolveAllIntersections();
  return true;
}
