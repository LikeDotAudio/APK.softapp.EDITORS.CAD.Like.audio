// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { BBox } from '../../core/types';
import type { Scene } from '../Scene';

export interface GridLinePass {
  /** Spacing between lines, in world units. */
  step: number;
  stroke: string;
  lineWidth: number;
  /** Skip every 10th line so a heavier pass can draw it instead. */
  skipEveryTenth: boolean;
}

/** Stroke one level of the grid — minor, major or super — as a single path. */
export function strokeGridLines({ ctx, view }: Scene, bounds: BBox, pass: GridLinePass): void {
  const { step, skipEveryTenth } = pass;
  ctx.strokeStyle = pass.stroke;
  ctx.lineWidth = pass.lineWidth;
  ctx.beginPath();

  for (let worldX = Math.floor(bounds.x1 / step) * step; worldX <= bounds.x2 + step * 0.5; worldX += step) {
    if (skipEveryTenth && Math.round(worldX / step) % 10 === 0) continue;
    const screenX = view.toScreen(worldX, 0).x;
    ctx.moveTo(screenX, 0);
    ctx.lineTo(screenX, view.height);
  }

  for (let worldY = Math.floor(bounds.y1 / step) * step; worldY <= bounds.y2 + step * 0.5; worldY += step) {
    if (skipEveryTenth && Math.round(worldY / step) % 10 === 0) continue;
    const screenY = view.toScreen(0, worldY).y;
    ctx.moveTo(0, screenY);
    ctx.lineTo(view.width, screenY);
  }

  ctx.stroke();
}
