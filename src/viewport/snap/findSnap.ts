// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { SNAP_PX } from '../../core/constants';
import type { Point } from '../../core/types';
import type { Doc } from '../../model/Doc';
import type { Viewport } from '../Viewport';

export type SnapType = 'endpoint' | 'midpoint' | 'grid' | 'none';

/** A snapped position plus what it snapped to, for the indicator to draw. */
export interface Snap extends Point {
  type: SnapType;
}

export interface SnapOptions {
  gridSize: number;
  snapToGrid: boolean;
}

/**
 * Snap priority: existing endpoints beat edge midpoints, which beat the grid.
 * Geometry snapping is always on — only the grid fallback is toggleable.
 */
export function findSnap(
  doc: Doc,
  view: Viewport,
  wx: number,
  wy: number,
  { gridSize, snapToGrid }: SnapOptions,
): Snap {
  const thr = view.pxToWorld(SNAP_PX);

  let bestD = thr;
  let best: Snap | null = null;
  for (const v of doc.vertices.values()) {
    const d = Math.hypot(v.x - wx, v.y - wy);
    if (d < bestD) {
      bestD = d;
      best = { type: 'endpoint', x: v.x, y: v.y };
    }
  }
  if (best) return best;

  bestD = thr;
  for (const e of doc.edges.values()) {
    const m = doc.edgeMidpoint(e);
    const d = Math.hypot(m.x - wx, m.y - wy);
    if (d < bestD) {
      bestD = d;
      best = { type: 'midpoint', x: m.x, y: m.y };
    }
  }
  if (best) return best;

  if (snapToGrid && gridSize > 0) {
    return {
      type: 'grid',
      x: Math.round(wx / gridSize) * gridSize,
      y: Math.round(wy / gridSize) * gridSize,
    };
  }
  return { type: 'none', x: wx, y: wy };
}
