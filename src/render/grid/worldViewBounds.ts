// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { BBox } from '../../core/types';
import type { Viewport } from '../../viewport/Viewport';

/** World-space rectangle currently visible in the viewport. */
export function worldViewBounds(view: Viewport): BBox {
  const a = view.toWorld(0, view.height);
  const b = view.toWorld(view.width, 0);
  return {
    x1: Math.min(a.x, b.x),
    y1: Math.min(a.y, b.y),
    x2: Math.max(a.x, b.x),
    y2: Math.max(a.y, b.y),
  };
}
