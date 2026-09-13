// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { CANVAS } from '../palette';

/** Solid arrowhead pointing along X. `dir` is +1 for right, -1 for left. */
export function arrowH(ctx: CanvasRenderingContext2D, x: number, y: number, dir: number): void {
  ctx.save();
  ctx.fillStyle = CANVAS.dimLine;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + dir * 7, y - 3);
  ctx.lineTo(x + dir * 7, y + 3);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
