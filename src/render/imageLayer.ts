// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { TracingImage } from '../image/TracingImage';
import { imageScreenRect } from '../image/imageScreenRect';
import type { Scene } from './Scene';
import { CANVAS } from './palette';

export function drawImageLayer({ ctx, view }: Scene, tracing: TracingImage | null): void {
  if (!tracing || !tracing.visible) return;
  const r = imageScreenRect(view, tracing);
  ctx.save();
  ctx.globalAlpha = tracing.opacity;
  ctx.drawImage(tracing.img, r.x, r.y, r.w, r.h);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = CANVAS.imageOutline;
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(r.x, r.y, r.w, r.h);
  ctx.setLineDash([]);
  ctx.restore();
}
