// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { CANVAS } from '../palette';
import type { Scene } from '../Scene';
import type { GridLevels } from './getGridLevels';
import { strokeGridLines } from './strokeGridLines';
import { worldViewBounds } from './worldViewBounds';

/** Three passes, lightest first, so the 10x and 100x lines read as heavier. */
export function drawGridLines(scene: Scene, levels: GridLevels): void {
  const bounds = worldViewBounds(scene.view);

  strokeGridLines(scene, bounds, {
    step: levels.minorWorld,
    stroke: CANVAS.grid,
    lineWidth: 1,
    skipEveryTenth: true,
  });
  strokeGridLines(scene, bounds, {
    step: levels.majorWorld,
    stroke: 'rgba(255, 255, 255, 0.18)',
    lineWidth: 1,
    skipEveryTenth: true,
  });
  strokeGridLines(scene, bounds, {
    step: levels.superWorld,
    stroke: 'rgba(255, 255, 255, 0.35)',
    lineWidth: 1.2,
    skipEveryTenth: false,
  });
}
