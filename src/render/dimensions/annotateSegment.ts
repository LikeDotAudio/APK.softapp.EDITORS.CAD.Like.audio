// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { formatLength } from '../../model/units/formatLength';
import type { Scene } from '../Scene';
import { dimDiag } from './dimDiag';
import { dimH } from './dimH';
import { dimV } from './dimV';

/** Length of a segment, using whichever dimension style matches its direction. */
export function annotateSegment(scene: Scene, x1: number, y1: number, x2: number, y2: number): void {
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 1e-6) return;
  const { ctx, view, units } = scene;
  const sa = view.toScreen(x1, y1);
  const sb = view.toScreen(x2, y2);
  const label = formatLength(len, units);
  const isHorizontal = Math.abs(y2 - y1) < 0.001 * len;
  const isVertical = Math.abs(x2 - x1) < 0.001 * len;
  if (isHorizontal) dimH(ctx, sa.x, (sa.y + sb.y) / 2, sb.x, label);
  else if (isVertical) dimV(ctx, (sa.x + sb.x) / 2, sa.y, sb.y, label);
  else dimDiag(ctx, sa.x, sa.y, sb.x, sb.y, label);
}
