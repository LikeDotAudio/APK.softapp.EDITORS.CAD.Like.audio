// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Layer } from '../../core/types';
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
    const pxHeight = Math.max(8, text.height * view.zoom);

    ctx.save();
    ctx.translate(screenPos.x, screenPos.y);

    if (text.rotation) {
      // Screen y is flipped relative to CAD world y (world y goes up, screen y goes down)
      ctx.rotate((-text.rotation * Math.PI) / 180);
    }

    ctx.font = `${Math.round(pxHeight)}px "JetBrains Mono", monospace, sans-serif`;
    ctx.textAlign = text.align ?? 'left';
    ctx.textBaseline = 'bottom';

    const color = text.color || layer?.color || '#ffffff';
    ctx.fillStyle = color;
    ctx.fillText(text.text, 0, 0);

    // If selected, draw outline
    if (options?.selectedIds?.has(text.id)) {
      const metrics = ctx.measureText(text.text);
      const w = metrics.width;
      const h = pxHeight;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(0, -h, w, h);
    }

    ctx.restore();
  }

  ctx.restore();
}
