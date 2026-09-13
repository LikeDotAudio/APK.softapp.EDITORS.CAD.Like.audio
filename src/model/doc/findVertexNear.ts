// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { EPS } from '../../core/constants';
import type { Doc } from '../Doc';

/** Id of a vertex within `eps` of the point, or null. */
export function findVertexNear(doc: Doc, x: number, y: number, eps = EPS): number | null {
  for (const v of doc.vertices.values()) {
    if (Math.abs(v.x - x) < eps && Math.abs(v.y - y) < eps && Math.hypot(v.x - x, v.y - y) < eps) {
      return v.id;
    }
  }
  return null;
}
