// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { BBox } from '../../core/types';
import type { Viewport } from '../../viewport/Viewport';
import { SELECTION_PAD_PX } from './handleSizes';

/** Grow a world bbox by a pixel margin so the net clears the geometry at any zoom. */
export function paddedBounds(view: Viewport, b: BBox, padPx = SELECTION_PAD_PX): BBox {
  const p = view.pxToWorld(padPx);
  return { x1: b.x1 - p, y1: b.y1 - p, x2: b.x2 + p, y2: b.y2 + p };
}
