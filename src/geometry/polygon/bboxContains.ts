// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { BBox } from '../../core/types';

/** True when `inner`'s box sits entirely within `outer`'s (a cheap containment reject). */
export function bboxContains(outer: BBox, inner: BBox, eps = 1e-9): boolean {
  return (
    inner.x1 >= outer.x1 - eps &&
    inner.y1 >= outer.y1 - eps &&
    inner.x2 <= outer.x2 + eps &&
    inner.y2 <= outer.y2 + eps
  );
}
