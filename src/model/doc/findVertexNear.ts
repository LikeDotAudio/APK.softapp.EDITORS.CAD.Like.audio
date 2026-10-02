// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { EPS } from '../../core/constants';
import type { Doc } from '../Doc';

/** Id of a vertex within `eps` of the point, or null. */
export function findVertexNear(doc: Doc, x: number, y: number, eps = EPS): number | null {
  if (doc.vertexGrid && doc.vertexGrid.size > 0) {
    const minX = Math.floor(x - eps);
    const maxX = Math.floor(x + eps);
    const minY = Math.floor(y - eps);
    const maxY = Math.floor(y + eps);

    for (let gx = minX; gx <= maxX; gx++) {
      for (let gy = minY; gy <= maxY; gy++) {
        const bucket = doc.vertexGrid.get(`${gx}:${gy}`);
        if (bucket) {
          for (const vId of bucket) {
            const v = doc.vertices.get(vId);
            if (v && Math.abs(v.x - x) < eps && Math.abs(v.y - y) < eps && Math.hypot(v.x - x, v.y - y) < eps) {
              return v.id;
            }
          }
        }
      }
    }
    return null;
  }

  for (const v of doc.vertices.values()) {
    if (Math.abs(v.x - x) < eps && Math.abs(v.y - y) < eps && Math.hypot(v.x - x, v.y - y) < eps) {
      return v.id;
    }
  }
  return null;
}
