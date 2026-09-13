// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { labelWithBackdrop } from '../labelWithBackdrop';
import { CANVAS, FONT } from '../palette';
import { arrowV } from './arrowV';

/** Vertical dimension between two screen Y positions, offset right of `sx`. */
export function dimV(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy1: number,
  sy2: number,
  label: string,
): void {
  if (Math.abs(sy2 - sy1) < 12) return;
  const x = sx + 24;
  ctx.save();
  ctx.strokeStyle = CANVAS.dimLine;
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(sx, sy1);
  ctx.lineTo(x, sy1);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(sx, sy2);
  ctx.lineTo(x, sy2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(x, sy1);
  ctx.lineTo(x, sy2);
  ctx.stroke();
  arrowV(ctx, x, sy1, 1);
  arrowV(ctx, x, sy2, -1);

  // The label reads bottom-to-top alongside the dimension line.
  ctx.save();
  ctx.translate(x + 14, (sy1 + sy2) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.font = FONT.dimension;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  labelWithBackdrop(ctx, label, 0, 0, CANVAS.dimText);
  ctx.restore();
  ctx.restore();
}
