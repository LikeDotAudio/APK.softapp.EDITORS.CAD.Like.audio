// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { CANVAS } from '../palette';
import type { Scene } from '../Scene';

/** The X=0 and Y=0 axes, drawn over the grid in both grid modes. */
export function drawWorldAxes({ ctx, view }: Scene): void {
  ctx.strokeStyle = CANVAS.axis;
  ctx.lineWidth = 1.5;
  const origin = view.toScreen(0, 0);
  ctx.beginPath();
  ctx.moveTo(origin.x, 0);
  ctx.lineTo(origin.x, view.height);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, origin.y);
  ctx.lineTo(view.width, origin.y);
  ctx.stroke();
}
