// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { formatLength } from '../../model/units/formatLength';
import { CANVAS, FONT } from '../palette';
import type { Scene } from '../Scene';

/** Dashed orange box around everything drawn, labelled with overall W and H. */
export function drawBoundsOverlay(scene: Scene): void {
  const { ctx, doc, view, units, gridSize } = scene;
  const bb = doc.bounds();
  if (!bb) return;

  const margin = Math.max(gridSize * 0.3, 0.02);
  const sa = view.toScreen(bb.x1 - margin, bb.y1 - margin);
  const sb = view.toScreen(bb.x2 + margin, bb.y2 + margin);
  const bx = Math.min(sa.x, sb.x);
  const by = Math.min(sa.y, sb.y);
  const bw = Math.abs(sb.x - sa.x);
  const bh = Math.abs(sb.y - sa.y);

  ctx.save();
  ctx.strokeStyle = CANVAS.bounds;
  ctx.lineWidth = 1.2;
  ctx.setLineDash([8, 5]);
  ctx.strokeRect(bx, by, bw, bh);
  ctx.setLineDash([]);
  ctx.font = FONT.dimension;

  const w = bb.x2 - bb.x1;
  const h = bb.y2 - bb.y1;
  if (w > 1e-6) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const text = `W: ${formatLength(w, units)}`;
    const tw = ctx.measureText(text).width;
    ctx.fillStyle = CANVAS.labelBackdrop;
    ctx.fillRect(bx + bw / 2 - tw / 2 - 3, by - 17, tw + 6, 14);
    ctx.fillStyle = CANVAS.bounds;
    ctx.fillText(text, bx + bw / 2, by - 3);
  }
  if (h > 1e-6) {
    ctx.save();
    ctx.translate(bx + bw + 20, by + bh / 2);
    ctx.rotate(-Math.PI / 2);
    const text = `H: ${formatLength(h, units)}`;
    const tw = ctx.measureText(text).width;
    ctx.fillStyle = CANVAS.labelBackdrop;
    ctx.fillRect(-tw / 2 - 3, -8, tw + 6, 15);
    ctx.fillStyle = CANVAS.bounds;
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }
  ctx.restore();
}
