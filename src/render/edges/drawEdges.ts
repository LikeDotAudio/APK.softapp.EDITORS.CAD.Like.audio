// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Point } from '../../core/types';
import { CANVAS } from '../palette';
import type { Scene } from '../Scene';
import { drawSelectionHandles } from './drawSelectionHandles';
import { drawSelectionNet } from './drawSelectionNet';
import type { EdgeStyleState } from './EdgeStyleState';
import { isDarkColor } from './isDarkColor';
import { renderEdge } from './renderEdge';

/** Every visible edge, then the selection handles and net on top. */
export function drawEdges(scene: Scene, state: EdgeStyleState): void {
  const { doc, view } = scene;
  const handlePoints: Point[] = [];
  const selectedIds: number[] = [];

  for (const e of doc.edges.values()) {
    const layer = state.layers?.get(e.layerId ?? '0');
    if (layer && !layer.visible) continue;

    const baseColor = isDarkColor(layer?.color) ? CANVAS.edge : layer!.color;

    if (state.selected.has(e.id)) {
      renderEdge(scene, e, CANVAS.edgeSelected, 2.8);
      selectedIds.push(e.id);

      const [a, b] = doc.endpointsOf(e);
      const mid = doc.edgeMidpoint(e);
      handlePoints.push(view.toScreen(a.x, a.y), view.toScreen(b.x, b.y), view.toScreen(mid.x, mid.y));
    } else if (state.hoverEnabled && e.id === state.hoverId) {
      renderEdge(scene, e, CANVAS.edgeHover, 2.2);
    } else {
      renderEdge(scene, e, baseColor, 1.5);
    }
  }

  drawSelectionHandles(scene.ctx, handlePoints);

  // The net only earns its place once there is more than one thing selected.
  const bounds = state.selected.size > 1 ? doc.boundsOf(selectedIds) : null;
  if (bounds) drawSelectionNet(scene, bounds);
}
