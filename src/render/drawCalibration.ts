// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { CalibrationState } from '../image/calibration/CalibrationState';
import { dot } from './dot';
import type { Scene } from './Scene';
import { CANVAS } from './palette';

/** Purple markers and rubber-band line for the scale-calibration pick. */
export function drawCalibration(scene: Scene, cal: CalibrationState): void {
  if (!cal.active || !cal.p1) return;
  const { ctx, view, pointer } = scene;

  const s1 = view.toScreen(cal.p1.x, cal.p1.y);
  const end = cal.p2 ?? pointer.rawWorld;
  const s2 = view.toScreen(end.x, end.y);

  ctx.save();
  ctx.strokeStyle = CANVAS.calibrate;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 3]);
  ctx.beginPath();
  ctx.moveTo(s1.x, s1.y);
  ctx.lineTo(s2.x, s2.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  dot(ctx, s1.x, s1.y, 5, CANVAS.calibrate);
  if (cal.p2) dot(ctx, s2.x, s2.y, 5, CANVAS.calibrate);
}
