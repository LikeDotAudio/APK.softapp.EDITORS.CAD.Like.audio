// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Point } from '../core/types';
import { commitLine } from '../model/commits/commitLine';
import { formatField } from '../model/units/formatField';
import { CANVAS } from '../render/palette';
import type { Tool } from './types';

interface ParallelState {
  distance: number;
}

const Icon = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <line x1="2" y1="5" x2="14" y2="5" />
    <line x1="2" y1="11" x2="14" y2="11" />
  </svg>
);

/**
 * Calculates a parallel offset line segment for an existing line edge at a given distance
 * on the side of the cursor point.
 */
function getParallelSegment(
  a: Point,
  b: Point,
  distance: number,
  cursor: Point,
): { p1: Point; p2: Point } | null {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  if (len < 1e-9) return null;

  // Normal vector (-dy/len, dx/len)
  const nx = -dy / len;
  const ny = dx / len;

  // Vector from a to cursor
  const cx = cursor.x - a.x;
  const cy = cursor.y - a.y;

  // Dot product with normal to determine which side cursor is on
  const dot = cx * nx + cy * ny;
  const sign = dot >= 0 ? 1 : -1;

  const ox = nx * distance * sign;
  const oy = ny * distance * sign;

  return {
    p1: { x: a.x + ox, y: a.y + oy },
    p2: { x: b.x + ox, y: b.y + oy },
  };
}

export const parallelTool: Tool<ParallelState> = {
  id: 'parallel',
  label: 'Parallel Line',
  shortcut: 'p',
  title: 'Parallel Line (P) — Offset line with exact distance & length',
  hint: 'Click reference line to create parallel offset line at specified distance',
  icon: Icon,
  cursor: 'crosshair',
  snaps: false,

  createState: () => ({ distance: 1.0 }),
  isDrawing: () => true,

  onPointerDown(state, input, api) {
    const edgeId = api.doc.hitEdgeAt(input.world.x, input.world.y, api.view.zoom);
    if (edgeId === null) return;

    const edge = api.doc.edge(edgeId);
    if (!edge || edge.type !== 'line') return;

    const [a, b] = api.doc.endpointsOf(edge);
    const par = getParallelSegment(a, b, state.distance, input.world);
    if (!par) return;

    api.edit(() =>
      commitLine(api.doc, par.p1.x, par.p1.y, par.p2.x, par.p2.y, api.activeLayerId),
    );
    api.showHint(`Created parallel line at offset ${state.distance}`, 3000);
  },

  onPointerMove(_state, input, api) {
    const edgeId = api.doc.hitEdgeAt(input.world.x, input.world.y, api.view.zoom);
    api.setHoverEdge(edgeId);
    api.openDynInput(input.client);
  },

  drawPreview(state, scene) {
    const { ctx, view, doc, pointer } = scene;
    const edgeId = doc.hitEdgeAt(pointer.world.x, pointer.world.y, view.zoom);
    if (edgeId === null) return;

    const edge = doc.edge(edgeId);
    if (!edge || edge.type !== 'line') return;

    const [a, b] = doc.endpointsOf(edge);
    const par = getParallelSegment(a, b, state.distance, pointer.world);
    if (!par) return;

    const s1 = view.toScreen(par.p1.x, par.p1.y);
    const s2 = view.toScreen(par.p2.x, par.p2.y);

    ctx.save();
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = CANVAS.preview;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(s1.x, s1.y);
    ctx.lineTo(s2.x, s2.y);
    ctx.stroke();
    ctx.restore();
  },

  dyn: {
    fields: () => [{ key: 'dist', label: 'Dist' }],

    placeholder(state, _key, _mode, _cursor, units) {
      return formatField(state.distance, units);
    },

    resolve(state, values) {
      if (values.dist !== null && values.dist !== undefined && values.dist > 0) {
        state.distance = values.dist;
      }
      return null;
    },

    commit() {
      // Input changed state.distance
    },
  },
};
