// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Edge } from '../../core/types';

/** Edges meeting at a vertex are not "crossing" — their touch point is already a node. */
export function sharesVertex(a: Edge, b: Edge): boolean {
  return a.v1 === b.v1 || a.v1 === b.v2 || a.v2 === b.v1 || a.v2 === b.v2;
}
