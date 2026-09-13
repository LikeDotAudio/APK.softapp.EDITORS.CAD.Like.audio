// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { CANVAS } from './palette';

/** Draw a text label with a translucent backdrop so it stays legible over geometry. */
export function labelWithBackdrop(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  padX = 3,
  halfHeight = 8,
): void {
  const tw = ctx.measureText(text).width;
  ctx.fillStyle = CANVAS.labelBackdrop;
  ctx.fillRect(x - tw / 2 - padX, y - halfHeight, tw + padX * 2, halfHeight * 2);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}
