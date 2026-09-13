// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Point } from '../../core/types';
import { CANVAS } from '../palette';
import { HANDLE_PX } from '../selectionBox/handleSizes';

/** Orange squares on every endpoint and midpoint of the selection. */
export function drawSelectionHandles(ctx: CanvasRenderingContext2D, points: Point[]): void {
  if (points.length === 0) return;
  ctx.save();
  ctx.fillStyle = CANVAS.handle;
  ctx.strokeStyle = CANVAS.white;
  ctx.lineWidth = 1;
  for (const p of points) {
    // Rounding keeps the 1px outline crisp instead of straddling two pixels.
    ctx.beginPath();
    ctx.rect(Math.round(p.x) - HANDLE_PX / 2, Math.round(p.y) - HANDLE_PX / 2, HANDLE_PX, HANDLE_PX);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}
