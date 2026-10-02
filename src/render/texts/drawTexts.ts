// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Layer } from '../../core/types';
import { isDarkColor } from '../edges/isDarkColor';
import type { Scene } from '../Scene';

export function drawTexts(
  scene: Scene,
  options?: {
    layers?: ReadonlyMap<string, Layer>;
    selectedIds?: ReadonlySet<number>;
  },
): void {
  const { ctx, view, doc } = scene;
  if (!doc.texts || doc.texts.size === 0) return;

  ctx.save();

  for (const text of doc.texts.values()) {
    const layer = options?.layers?.get(text.layerId);
    if (layer && !layer.visible) continue;

    const screenPos = view.toScreen(text.x, text.y);
    // Viewport culling: skip texts completely outside the visible canvas
    if (
      screenPos.x < -400 ||
      screenPos.x > ctx.canvas.width + 400 ||
      screenPos.y < -400 ||
      screenPos.y > ctx.canvas.height + 400
    ) {
      continue;
    }

    let pxHeight: number;
    if (scene.fixedTextSize) {
      pxHeight = 11;
    } else {
      // Scale proportionally with CAD geometry matching DXF cap-height to em-square ratio
      pxHeight = (text.height / 0.7) * view.zoom;
    }

    // Greeking threshold: skip sub-pixel text when zoomed out so text does not clutter or overlap
    if (pxHeight < 2.5) continue;

    ctx.save();
    ctx.translate(screenPos.x, screenPos.y);

    if (text.rotation) {
      // Screen y is flipped relative to CAD world y (world y goes up, screen y goes down)
      ctx.rotate((-text.rotation * Math.PI) / 180);
    }

    ctx.font = `${Math.round(pxHeight)}px "JetBrains Mono", monospace, sans-serif`;
    ctx.textAlign = text.align ?? 'left';
    
    let baseline: CanvasTextBaseline = 'bottom';
    if (text.vAlign === 'top') baseline = 'top';
    else if (text.vAlign === 'middle') baseline = 'middle';
    else if (text.vAlign === 'baseline') baseline = 'alphabetic';
    else baseline = 'bottom';
    ctx.textBaseline = baseline;

    const rawColor = text.color || layer?.color || '#ffffff';
    const color = isDarkColor(rawColor) ? '#ffffff' : rawColor;
    ctx.fillStyle = color;
    ctx.fillText(text.text, 0, 0);

    // If selected, draw outline aligned with text anchor
    if (options?.selectedIds?.has(text.id)) {
      const metrics = ctx.measureText(text.text);
      const w = metrics.width;
      const h = pxHeight;

      let bx = 0;
      if (text.align === 'center') bx = -w / 2;
      else if (text.align === 'right') bx = -w;

      let by = 0;
      if (text.vAlign === 'top') by = 0;
      else if (text.vAlign === 'middle') by = -h / 2;
      else if (text.vAlign === 'baseline') by = -h * 0.8;
      else by = -h; // bottom

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(bx, by, w, h);
    }

    ctx.restore();
  }

  ctx.restore();
}
