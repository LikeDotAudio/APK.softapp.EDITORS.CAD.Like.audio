// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { CANVAS } from '../palette';
import type { Scene } from '../Scene';
import type { GridLevels } from './getGridLevels';
import { worldViewBounds } from './worldViewBounds';

const MAJOR_DOT = 'rgba(255, 255, 255, 0.3)';
const SUPER_DOT = 'rgba(255, 255, 255, 0.45)';

/** Dots at every minor intersection, fattened on the 10x and 100x lines. */
export function drawGridDots({ ctx, view }: Scene, levels: GridLevels): void {
  const bounds = worldViewBounds(view);
  const step = levels.minorWorld;

  const startX = Math.floor(bounds.x1 / step) * step;
  const endX = Math.ceil(bounds.x2 / step) * step;
  const startY = Math.floor(bounds.y1 / step) * step;
  const endY = Math.ceil(bounds.y2 / step) * step;

  for (let worldX = startX; worldX <= endX + step * 0.5; worldX += step) {
    const indexX = Math.round(worldX / step);
    const screenX = view.toScreen(worldX, 0).x;

    for (let worldY = startY; worldY <= endY + step * 0.5; worldY += step) {
      const indexY = Math.round(worldY / step);
      const screenY = view.toScreen(0, worldY).y;

      const isSuper = indexX % 100 === 0 && indexY % 100 === 0;
      const isMajor = indexX % 10 === 0 && indexY % 10 === 0;

      const size = isSuper ? 2.5 : isMajor ? 1.8 : 1;
      ctx.fillStyle = isSuper ? SUPER_DOT : isMajor ? MAJOR_DOT : CANVAS.grid;
      ctx.fillRect(screenX - size / 2, screenY - size / 2, size, size);
    }
  }
}
