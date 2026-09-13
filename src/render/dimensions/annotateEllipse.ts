// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { formatLength } from '../../model/units/formatLength';
import type { Scene } from '../Scene';
import { dimH } from './dimH';
import { dimV } from './dimV';

/** Major and minor axis lengths of an ellipse being sketched. */
export function annotateEllipse(scene: Scene, cx: number, cy: number, rx: number, ry: number): void {
  if (rx < 1e-6 && ry < 1e-6) return;
  const { ctx, view, units } = scene;
  const sx1 = view.toScreen(cx - rx, 0).x;
  const sx2 = view.toScreen(cx + rx, 0).x;
  const sy1 = view.toScreen(0, cy + ry).y;
  const sy2 = view.toScreen(0, cy - ry).y;
  const scx = view.toScreen(cx, 0).x;
  const scy = view.toScreen(0, cy).y;
  if (rx > 1e-6) dimH(ctx, sx1, scy, sx2, formatLength(rx * 2, units), false);
  if (ry > 1e-6) dimV(ctx, scx, sy1, sy2, formatLength(ry * 2, units));
}
