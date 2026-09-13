// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { formatLength } from '../../model/units/formatLength';
import type { Scene } from '../Scene';
import { dimH } from './dimH';
import { dimV } from './dimV';

/** Width above and height right of a rectangle being sketched. */
export function annotateRect(scene: Scene, x1: number, y1: number, x2: number, y2: number): void {
  const w = Math.abs(x2 - x1);
  const h = Math.abs(y2 - y1);
  if (!w && !h) return;
  const { ctx, view, units } = scene;
  const sxLeft = view.toScreen(Math.min(x1, x2), 0).x;
  const sxRight = view.toScreen(Math.max(x1, x2), 0).x;
  const syTop = view.toScreen(0, Math.max(y1, y2)).y;
  const syBottom = view.toScreen(0, Math.min(y1, y2)).y;
  if (w > 1e-6) dimH(ctx, sxLeft, syTop, sxRight, formatLength(w, units), true);
  if (h > 1e-6) dimV(ctx, sxRight, syTop, syBottom, formatLength(h, units));
}
