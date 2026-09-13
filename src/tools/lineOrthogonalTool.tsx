// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Point } from '../core/types';
import { commitLine } from '../model/commits/commitLine';
import { formatField } from '../model/units/formatField';
import { CANVAS } from '../render/palette';
import type { Tool } from './types';

interface OrthogonalState {
  length: number;
}

const Icon = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <line x1="2" y1="14" x2="14" y2="14" />
    <line x1="8" y1="14" x2="8" y2="2" />
    <rect x="8" y="11" width="3" height="3" />
  </svg>
);

function getOrthogonalLine(
  a: Point,
  b: Point,
  cursor: Point,
  length: number,
): { p1: Point; p2: Point } | null {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  if (len < 1e-9) return null;

  // Projection of cursor onto line AB to find perpendicular foot point
  const t = ((cursor.x - a.x) * dx + (cursor.y - a.y) * dy) / (len * len);
  const footX = a.x + t * dx;
  const footY = a.y + t * dy;

  // Normal vector (-dy/len, dx/len)
  const nx = -dy / len;
  const ny = dx / len;

  // Side of cursor relative to line
  const dot = (cursor.x - a.x) * nx + (cursor.y - a.y) * ny;
  const sign = dot >= 0 ? 1 : -1;

  return {
    p1: { x: footX, y: footY },
    p2: { x: footX + nx * length * sign, y: footY + ny * length * sign },
  };
}

export const lineOrthogonalTool: Tool<OrthogonalState> = {
  id: 'lineOrthogonal',
  label: 'Orthogonal Line',
  shortcut: 'o',
  title: 'Orthogonal Line (O) — Draw line perpendicular to reference line',
  hint: 'Hover reference line & click position for perpendicular line',
  icon: Icon,
  cursor: 'crosshair',
  snaps: false,

  createState: () => ({ length: 1.5 }),
  isDrawing: () => true,

  onPointerDown(state, input, api) {
    const edgeId = api.doc.hitEdgeAt(input.world.x, input.world.y, api.view.zoom);
    if (edgeId === null) return;

    const edge = api.doc.edge(edgeId);
    if (!edge || edge.type !== 'line') return;

    const [a, b] = api.doc.endpointsOf(edge);
    const ortho = getOrthogonalLine(a, b, input.world, state.length);
    if (!ortho) return;

    api.edit(() =>
      commitLine(api.doc, ortho.p1.x, ortho.p1.y, ortho.p2.x, ortho.p2.y, api.activeLayerId),
    );
    api.showHint(`Created orthogonal line with length ${state.length}`, 3000);
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
    const ortho = getOrthogonalLine(a, b, pointer.world, state.length);
    if (!ortho) return;

    const s1 = view.toScreen(ortho.p1.x, ortho.p1.y);
    const s2 = view.toScreen(ortho.p2.x, ortho.p2.y);

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
    fields: () => [{ key: 'len', label: 'Len' }],

    placeholder(state, _key, _mode, _cursor, units) {
      return formatField(state.length, units);
    },

    resolve(state, values) {
      if (values.len !== null && values.len !== undefined && values.len > 0) {
        state.length = values.len;
      }
      return null;
    },

    commit() {},
  },
};
