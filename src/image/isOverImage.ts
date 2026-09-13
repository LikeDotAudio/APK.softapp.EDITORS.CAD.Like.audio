// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Viewport } from '../viewport/Viewport';
import { imageScreenRect } from './imageScreenRect';
import type { TracingImage } from './TracingImage';

/** True when a canvas-space point is over the tracing image. */
export function isOverImage(view: Viewport, t: TracingImage, sx: number, sy: number): boolean {
  const r = imageScreenRect(view, t);
  return sx >= r.x && sx <= r.x + r.w && sy >= r.y && sy <= r.y + r.h;
}
