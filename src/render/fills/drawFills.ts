// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Layer } from '../../core/types';
import type { Scene } from '../Scene';
import { strokeHatch } from './strokeHatch';

export function drawFills(
  scene: Scene,
  options?: {
    layers?: ReadonlyMap<string, Layer>;
    selectedIds?: ReadonlySet<number>;
  },
): void {
  const { ctx, view, doc } = scene;
  if (!doc.fills || doc.fills.size === 0) return;

  ctx.save();

  for (const fill of doc.fills.values()) {
    if (fill.points.length < 3) continue;

    const layer = options?.layers?.get(fill.layerId);
    if (layer && !layer.visible) continue;

    const screenPts = fill.points.map((p) => view.toScreen(p.x, p.y));
    const color = fill.color || layer?.color || '#3b82f6';
    const opacity = fill.opacity ?? 0.35;

    ctx.save();
    ctx.beginPath();
    screenPts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.closePath();

    if (fill.type === 'hatch') {
      /* A palette patch is a material, and a material reads as a tint with a
         pattern on it; a bare hatch over white paper reads as a sketch. */
      if (fill.paletteId) {
        ctx.globalAlpha = opacity * 0.5;
        ctx.fillStyle = color;
        ctx.fill();
      }
      ctx.globalAlpha = Math.min(1, opacity + 0.2);
      strokeHatch(ctx, screenPts, fill.hatchPattern, color);
      // The hatch laid its own strokes as the current path; trace the outline again for the border.
      ctx.beginPath();
      screenPts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.closePath();
    } else {
      // Solid fill with opacity
      ctx.globalAlpha = opacity;
      ctx.fillStyle = color;
      ctx.fill();
    }

    // Border stroke for fill
    ctx.globalAlpha = Math.min(1, opacity + 0.3);
    ctx.strokeStyle = options?.selectedIds?.has(fill.id) ? '#38bdf8' : color;
    ctx.lineWidth = options?.selectedIds?.has(fill.id) ? 2 : 1;
    if (options?.selectedIds?.has(fill.id)) {
      ctx.setLineDash([4, 4]);
    }
    ctx.stroke();

    ctx.restore();
  }

  ctx.restore();
}
