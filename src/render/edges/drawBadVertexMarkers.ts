// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { TAU } from '../../core/constants';
import { CANVAS, FONT } from '../palette';
import type { Scene } from '../Scene';

/**
 * Flag vertices that make the drawing uncuttable: degree 1 is a loose end,
 * degree 3+ is a crossing. Degree 0 and 2 are healthy and stay unmarked.
 */
export function drawBadVertexMarkers({ ctx, doc, view }: Scene): void {
  for (const v of doc.vertices.values()) {
    const deg = doc.vertexDegree(v.id);
    if (deg === 0 || deg === 2) continue;

    const s = view.toScreen(v.x, v.y);
    const isLooseEnd = deg === 1;
    ctx.save();
    ctx.fillStyle = isLooseEnd ? CANVAS.danger : CANVAS.warning;
    ctx.strokeStyle = CANVAS.white;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(s.x, s.y, isLooseEnd ? 6 : 7, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = CANVAS.white;
    ctx.font = FONT.marker;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isLooseEnd ? '!' : String(deg), s.x, s.y);
    ctx.restore();
  }
}
