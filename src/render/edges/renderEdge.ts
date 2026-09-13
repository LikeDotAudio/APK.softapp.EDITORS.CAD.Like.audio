// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Edge } from '../../core/types';
import type { Scene } from '../Scene';

/** Stroke a single edge. Arcs are drawn as real canvas arcs, never tessellated. */
export function renderEdge(scene: Scene, e: Edge, stroke: string, lineWidth: number): void {
  const { ctx, doc, view } = scene;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.setLineDash([]);

  const [a, b] = doc.endpointsOf(e);
  if (e.type === 'line') {
    const sa = view.toScreen(a.x, a.y);
    const sb = view.toScreen(b.x, b.y);
    ctx.beginPath();
    ctx.moveTo(sa.x, sa.y);
    ctx.lineTo(sb.x, sb.y);
    ctx.stroke();
    return;
  }

  const a1 = Math.atan2(a.y - e.cy, a.x - e.cx);
  const a2 = Math.atan2(b.y - e.cy, b.x - e.cx);
  const sc = view.toScreen(e.cx, e.cy);
  // Screen Y is flipped, so a world-CCW arc is drawn clockwise-negated here.
  ctx.beginPath();
  ctx.arc(sc.x, sc.y, e.r * view.zoom, -a1, -a2, true);
  ctx.stroke();
}
