// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { BBox, Point } from '../../core/types';

/**
 * Corners in world space, ordered so the opposite corner of `i` is `(i + 2) % 4`.
 * That pairing is what anchors a corner drag to the far corner.
 */
export function cornerPoints(b: BBox): Point[] {
  return [
    { x: b.x1, y: b.y1 },
    { x: b.x2, y: b.y1 },
    { x: b.x2, y: b.y2 },
    { x: b.x1, y: b.y2 },
  ];
}
