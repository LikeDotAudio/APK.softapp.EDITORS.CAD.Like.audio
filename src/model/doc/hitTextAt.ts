// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { HIT_PX } from '../../core/constants';
import type { Doc } from '../Doc';

/**
 * Nearest text entity within `maxPx` screen pixels at the given zoom, else null.
 * Tests against the text bounding box in rotated local space.
 */
export function hitTextAt(
  doc: Doc,
  wx: number,
  wy: number,
  zoom: number,
  maxPx = HIT_PX,
): number | null {
  if (!doc.texts || doc.texts.size === 0) return null;

  let best: number | null = null;
  let bestD = maxPx / zoom;

  for (const t of doc.texts.values()) {
    const rot = t.rotation ?? 0;
    const rad = (-rot * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    // Transform world point into text local space (origin at text insertion point)
    const dx = wx - t.x;
    const dy = wy - t.y;
    const lx = dx * cos - dy * sin;
    const ly = dx * sin + dy * cos;

    // Approximate width and height in world units
    // Cap height is t.height, em-width is ~0.6 * height per character
    const charWidth = Math.max(t.height * 0.6, 0.05);
    const textWidth = Math.max(t.text.length * charWidth, t.height);
    const textHeight = Math.max(t.height, 0.1);

    let minX = 0;
    let maxX = textWidth;
    if (t.align === 'center') {
      minX = -textWidth / 2;
      maxX = textWidth / 2;
    } else if (t.align === 'right') {
      minX = -textWidth;
      maxX = 0;
    }

    let minY = 0;
    let maxY = textHeight;
    if (t.vAlign === 'top') {
      minY = -textHeight;
      maxY = 0;
    } else if (t.vAlign === 'middle') {
      minY = -textHeight / 2;
      maxY = textHeight / 2;
    } else if (t.vAlign === 'baseline') {
      minY = -textHeight * 0.2;
      maxY = textHeight * 0.8;
    } else {
      // 'bottom' (default)
      minY = 0;
      maxY = textHeight;
    }

    // Distance to axis-aligned bounding box in local space
    const clampedX = Math.max(minX, Math.min(maxX, lx));
    const clampedY = Math.max(minY, Math.min(maxY, ly));
    const d = Math.hypot(lx - clampedX, ly - clampedY);

    if (d < bestD) {
      bestD = d;
      best = t.id;
    }
  }

  return best;
}
