// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { TAU } from '../core/constants';
import type { Snap } from '../viewport/snap/findSnap';
import type { Scene } from './Scene';
import { CANVAS } from './palette';

/** Green square = endpoint, amber diamond = midpoint, blue dot = free/grid. */
export function drawSnapIndicator({ ctx, view }: Scene, snap: Snap | null): void {
  if (!snap) return;
  const s = view.toScreen(snap.x, snap.y);
  ctx.save();
  if (snap.type === 'endpoint') {
    ctx.strokeStyle = CANVAS.snapEndpoint;
    ctx.lineWidth = 2;
    ctx.fillStyle = CANVAS.snapEndpointFill;
    ctx.beginPath();
    ctx.rect(s.x - 6, s.y - 6, 12, 12);
    ctx.fill();
    ctx.stroke();
  } else if (snap.type === 'midpoint') {
    ctx.strokeStyle = CANVAS.snapMidpoint;
    ctx.lineWidth = 2;
    ctx.fillStyle = CANVAS.snapMidpointFill;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y - 7);
    ctx.lineTo(s.x + 7, s.y);
    ctx.lineTo(s.x, s.y + 7);
    ctx.lineTo(s.x - 7, s.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.fillStyle = CANVAS.cursorDot;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 3, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}
