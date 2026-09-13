// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { ValidationResult } from '../../core/types';
import { CANVAS, FONT } from '../palette';
import type { Scene } from '../Scene';

/** Red pill under the drawing naming the first thing blocking export. */
export function drawErrorBanner(scene: Scene, validation: ValidationResult): void {
  const { ctx, doc, view, gridSize } = scene;
  if (doc.isEmpty || validation.valid) return;
  const bb = doc.bounds();
  if (!bb) return;

  const margin = Math.max(gridSize * 0.3, 0.02);
  const anchor = view.toScreen((bb.x1 + bb.x2) / 2, bb.y1 - margin);
  const y = anchor.y + 22;
  const msg = `⚠  ${validation.errs[0] ?? ''}`;

  ctx.save();
  ctx.font = FONT.banner;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const tw = ctx.measureText(msg).width;
  // Soft white halo keeps it legible against busy geometry.
  ctx.shadowColor = 'rgba(255,255,255,.9)';
  ctx.shadowBlur = 8;
  ctx.fillStyle = CANVAS.dangerFill;
  ctx.beginPath();
  ctx.roundRect(anchor.x - tw / 2 - 14, y - 14, tw + 28, 28, 7);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = CANVAS.white;
  ctx.fillText(msg, anchor.x, y);
  ctx.restore();
}
