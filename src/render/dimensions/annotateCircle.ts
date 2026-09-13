// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { formatLength } from '../../model/units/formatLength';
import { CANVAS, FONT } from '../palette';
import type { Scene } from '../Scene';

/** Diameter callout across a circle being sketched. */
export function annotateCircle(scene: Scene, cx: number, cy: number, r: number): void {
  if (r < 1e-6) return;
  const { ctx, view, units } = scene;
  const c = view.toScreen(cx, cy);
  const rs = r * view.zoom;
  const label = `⌀${formatLength(r * 2, units)}`;

  ctx.save();
  ctx.strokeStyle = CANVAS.dimLine;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(c.x - rs - 8, c.y);
  ctx.lineTo(c.x + rs + 8, c.y);
  ctx.stroke();
  ctx.setLineDash([]);
  for (const x of [c.x - rs, c.x + rs]) {
    ctx.beginPath();
    ctx.moveTo(x, c.y - 5);
    ctx.lineTo(x, c.y + 5);
    ctx.stroke();
  }
  ctx.font = FONT.dimension;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  const tw = ctx.measureText(label).width;
  ctx.fillStyle = CANVAS.labelBackdrop;
  ctx.fillRect(c.x - tw / 2 - 3, c.y - rs - 20, tw + 6, 16);
  ctx.fillStyle = CANVAS.dimText;
  ctx.fillText(label, c.x, c.y - rs - 4);
  ctx.restore();
}
