// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { TAU } from '../core/constants';
import type { Scene } from './Scene';

/** Dashed ring around the first polyline point, showing where a click closes the loop. */
export function closeLoopTarget(scene: Scene, wx: number, wy: number): void {
  const { ctx, view } = scene;
  const s = view.toScreen(wx, wy);
  ctx.save();
  ctx.strokeStyle = 'rgba(249,115,22,.5)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.arc(s.x, s.y, 11, 0, TAU);
  ctx.stroke();
  ctx.restore();
}
