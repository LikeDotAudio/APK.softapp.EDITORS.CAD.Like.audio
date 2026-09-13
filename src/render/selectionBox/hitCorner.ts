// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { BBox, Point } from '../../core/types';
import type { Viewport } from '../../viewport/Viewport';
import { cornerPoints } from './cornerPoints';
import { CORNER_HIT_PX } from './handleSizes';

/** Index of the corner handle under a screen point, or null when the cursor is clear of all four. */
export function hitCorner(view: Viewport, b: BBox, screen: Point, hitPx = CORNER_HIT_PX): number | null {
  const corners = cornerPoints(b);
  for (let i = 0; i < corners.length; i++) {
    const s = view.toScreen(corners[i].x, corners[i].y);
    if (Math.abs(s.x - screen.x) <= hitPx && Math.abs(s.y - screen.y) <= hitPx) return i;
  }
  return null;
}
