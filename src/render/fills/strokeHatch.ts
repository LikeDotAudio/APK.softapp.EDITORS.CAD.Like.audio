// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Point } from '../../core/types';

/** Screen pixels between hatch lines — a pattern, not a scale drawing of one. */
const STEP = 10;

/**
 * Hatch the closed screen polygon `pts` in `pattern`, clipped to it.
 *
 *   ANSI31  45° lines (the default — "some material", as drafting has it)
 *   ANSI37  45° crossed both ways
 *   GRID    a square grid
 *   DOTS    a dot field
 *
 * Anything else falls back to ANSI31: a pattern named by a host or a DXF that
 * this painter has never heard of should still read as hatched, not as empty.
 * The caller sets alpha and colour; this only lays the strokes.
 */
export function strokeHatch(ctx: CanvasRenderingContext2D, pts: Point[], pattern: string | undefined, color: string): void {
  if (pts.length < 3) return;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const w = maxX - minX;
  const h = maxY - minY;
  const kind = (pattern ?? 'ANSI31').toUpperCase();

  ctx.save();
  ctx.beginPath();
  pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.closePath();
  ctx.clip();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();

  if (kind === 'GRID') {
    for (let x = minX; x <= maxX; x += STEP) {
      ctx.moveTo(x, minY);
      ctx.lineTo(x, maxY);
    }
    for (let y = minY; y <= maxY; y += STEP) {
      ctx.moveTo(minX, y);
      ctx.lineTo(maxX, y);
    }
  } else if (kind === 'DOTS') {
    for (let x = minX + STEP / 2; x <= maxX; x += STEP) {
      for (let y = minY + STEP / 2; y <= maxY; y += STEP) ctx.rect(x - 0.75, y - 0.75, 1.5, 1.5);
    }
    ctx.fill();
    ctx.restore();
    return;
  } else {
    const d = w + h;
    for (let o = -d; o < d; o += STEP) {
      ctx.moveTo(minX + o, maxY);
      ctx.lineTo(minX + o + h, minY);
      if (kind === 'ANSI37') {
        ctx.moveTo(minX + o, minY);
        ctx.lineTo(minX + o + h, maxY);
      }
    }
  }
  ctx.stroke();
  ctx.restore();
}
