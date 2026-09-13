// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Point } from '../core/types';
import { CANVAS } from '../render/palette';
import type { Tool } from './types';

interface RotateState {
  center: Point | null;
  angleDeg: number;
}

const Icon = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M14 8A6 6 0 1 1 8 2" />
    <polyline points="8 0 8 4 12 2" />
  </svg>
);

export const rotateTool: Tool<RotateState> = {
  id: 'rotate',
  label: 'Rotate',
  shortcut: 'r',
  title: 'Rotate (R) — Rotate selected geometry around a pivot point by N degrees',
  hint: 'Select geometry first, then click pivot point to rotate by N degrees',
  icon: Icon,
  cursor: 'crosshair',
  snaps: true,

  createState: () => ({ center: null, angleDeg: 45 }),
  isDrawing: (s) => s.center !== null,

  onPointerDown(state, input, api) {
    if (api.selection.size === 0) {
      api.showHint('Select elements first using Select (S) before rotating.', 4000);
      return;
    }

    state.center = { ...input.world };
    api.openDynInput(input.client);

    const center = state.center;
    const rad = (state.angleDeg * Math.PI) / 180;
    const selectedEdges = Array.from(api.selection);

    api.edit(() => api.doc.rotateEdges(selectedEdges, center.x, center.y, rad));
    api.showHint(`Rotated ${selectedEdges.length} elements by ${state.angleDeg}°`, 3000);
    state.center = null;
    api.closeDynInput();
  },

  drawPreview(state, scene) {
    const { ctx, view, doc, pointer, selection } = scene;
    if (!selection || selection.size === 0) return;

    const center = state.center || pointer.world;
    const rad = (state.angleDeg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    ctx.save();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = CANVAS.preview;
    ctx.lineWidth = 1.5;

    for (const id of selection) {
      const e = doc.edge(id);
      if (!e) continue;
      const [a, b] = doc.endpointsOf(e);

      // Rotate endpoints preview
      const ra = {
        x: center.x + (a.x - center.x) * cos - (a.y - center.y) * sin,
        y: center.y + (a.x - center.x) * sin + (a.y - center.y) * cos,
      };
      const rb = {
        x: center.x + (b.x - center.x) * cos - (b.y - center.y) * sin,
        y: center.y + (b.x - center.x) * sin + (b.y - center.y) * cos,
      };

      const sa = view.toScreen(ra.x, ra.y);
      const sb = view.toScreen(rb.x, rb.y);

      if (e.type === 'line') {
        ctx.beginPath();
        ctx.moveTo(sa.x, sa.y);
        ctx.lineTo(sb.x, sb.y);
        ctx.stroke();
      } else if (e.type === 'arc') {
        const rcx = center.x + (e.cx - center.x) * cos - (e.cy - center.y) * sin;
        const rcy = center.y + (e.cx - center.x) * sin + (e.cy - center.y) * cos;
        const sc = view.toScreen(rcx, rcy);
        const a1 = Math.atan2(ra.y - rcy, ra.x - rcx);
        const a2 = Math.atan2(rb.y - rcy, rb.x - rcx);
        ctx.beginPath();
        ctx.arc(sc.x, sc.y, e.r * view.zoom, -a1, -a2, true);
        ctx.stroke();
      }
    }

    // Draw Pivot Point Marker
    const sc = view.toScreen(center.x, center.y);
    ctx.fillStyle = CANVAS.preview;
    ctx.beginPath();
    ctx.arc(sc.x, sc.y, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  },

  dyn: {
    fields: () => [{ key: 'ang', label: 'Angle°' }],

    placeholder(state) {
      return `${state.angleDeg}`;
    },

    resolve(state, values) {
      if (values.ang !== null && values.ang !== undefined) {
        state.angleDeg = values.ang;
      }
      return null;
    },

    commit() {
      // Angle state updated
    },
  },
};
