// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { BBox } from '../../core/types';
import { CANVAS } from '../palette';
import type { Scene } from '../Scene';
import { cornerPoints } from '../selectionBox/cornerPoints';
import { CORNER_PX } from '../selectionBox/handleSizes';
import { paddedBounds } from '../selectionBox/paddedBounds';

/** Dashed box around a multi-element selection, with its four grab corners. */
export function drawSelectionNet({ ctx, view }: Scene, bounds: BBox): void {
  const b = paddedBounds(view, bounds);
  const tl = view.toScreen(b.x1, b.y2);
  const br = view.toScreen(b.x2, b.y1);

  ctx.save();
  ctx.strokeStyle = CANVAS.selectionNet;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
  ctx.setLineDash([]);

  ctx.fillStyle = CANVAS.handle;
  ctx.strokeStyle = CANVAS.white;
  ctx.lineWidth = 1.2;
  for (const c of cornerPoints(b)) {
    const s = view.toScreen(c.x, c.y);
    ctx.beginPath();
    ctx.rect(Math.round(s.x) - CORNER_PX / 2, Math.round(s.y) - CORNER_PX / 2, CORNER_PX, CORNER_PX);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}
