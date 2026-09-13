// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { labelWithBackdrop } from '../labelWithBackdrop';
import { CANVAS, FONT } from '../palette';
import { arrowH } from './arrowH';

/** Horizontal dimension between two screen X positions on baseline `sy`. */
export function dimH(
  ctx: CanvasRenderingContext2D,
  sx1: number,
  sy: number,
  sx2: number,
  label: string,
  above = true,
): void {
  if (Math.abs(sx2 - sx1) < 12) return;
  const y = sy + (above ? -20 : 20);
  ctx.save();
  ctx.strokeStyle = CANVAS.dimLine;
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(sx1, sy);
  ctx.lineTo(sx1, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(sx2, sy);
  ctx.lineTo(sx2, y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(sx1, y);
  ctx.lineTo(sx2, y);
  ctx.stroke();
  arrowH(ctx, sx1, y, 1);
  arrowH(ctx, sx2, y, -1);
  ctx.font = FONT.dimension;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  labelWithBackdrop(ctx, label, (sx1 + sx2) / 2, y, CANVAS.dimText);
  ctx.restore();
}
