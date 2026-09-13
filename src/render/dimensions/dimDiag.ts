// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { labelWithBackdrop } from '../labelWithBackdrop';
import { CANVAS, FONT } from '../palette';

/** Dimension parallel to an arbitrary segment, offset along its normal. */
export function dimDiag(
  ctx: CanvasRenderingContext2D,
  sx1: number,
  sy1: number,
  sx2: number,
  sy2: number,
  label: string,
): void {
  const len = Math.hypot(sx2 - sx1, sy2 - sy1);
  if (len < 12) return;
  const nx = (-(sy2 - sy1) / len) * 22;
  const ny = ((sx2 - sx1) / len) * 22;
  ctx.save();
  ctx.strokeStyle = CANVAS.dimLine;
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(sx1, sy1);
  ctx.lineTo(sx1 + nx, sy1 + ny);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(sx2, sy2);
  ctx.lineTo(sx2 + nx, sy2 + ny);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(sx1 + nx, sy1 + ny);
  ctx.lineTo(sx2 + nx, sy2 + ny);
  ctx.stroke();
  ctx.font = FONT.dimension;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  labelWithBackdrop(ctx, label, (sx1 + sx2) / 2 + nx, (sy1 + sy2) / 2 + ny, CANVAS.dimText);
  ctx.restore();
}
