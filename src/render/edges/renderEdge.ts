// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Edge } from '../../core/types';
import type { Scene } from '../Scene';

/** Stroke a single edge. Arcs are drawn as real canvas arcs, never tessellated. */
export function renderEdge(scene: Scene, e: Edge, stroke: string, lineWidth: number): void {
  const { ctx, doc, view } = scene;
  const [a, b] = doc.endpointsOf(e);
  if (e.type === 'line') {
    const sa = view.toScreen(a.x, a.y);
    const sb = view.toScreen(b.x, b.y);

    const minX = sa.x < sb.x ? sa.x : sb.x;
    const maxX = sa.x > sb.x ? sa.x : sb.x;
    const minY = sa.y < sb.y ? sa.y : sb.y;
    const maxY = sa.y > sb.y ? sa.y : sb.y;
    if (maxX < -50 || minX > ctx.canvas.width + 50 || maxY < -50 || minY > ctx.canvas.height + 50) {
      return;
    }

    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(sa.x, sa.y);
    ctx.lineTo(sb.x, sb.y);
    ctx.stroke();
    return;
  }

  const sc = view.toScreen(e.cx, e.cy);
  const sr = e.r * view.zoom;
  if (sc.x + sr < -50 || sc.x - sr > ctx.canvas.width + 50 || sc.y + sr < -50 || sc.y - sr > ctx.canvas.height + 50) {
    return;
  }

  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.setLineDash([]);
  const a1 = Math.atan2(a.y - e.cy, a.x - e.cx);
  const a2 = Math.atan2(b.y - e.cy, b.x - e.cx);
  // Screen Y is flipped, so a world-CCW arc is drawn clockwise-negated here.
  ctx.beginPath();
  ctx.arc(sc.x, sc.y, sr, -a1, -a2, true);
  ctx.stroke();
}
