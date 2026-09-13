// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Point } from '../core/types';
import { commitLine } from '../model/commits/commitLine';
import { formatField } from '../model/units/formatField';
import { annotateSegment } from '../render/dimensions/annotateSegment';
import { CANVAS } from '../render/palette';
import type { Tool } from './types';

interface LineState {
  start: Point | null;
}

const Icon = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <line x1="2" y1="14" x2="14" y2="2" />
  </svg>
);

export const lineTool: Tool<LineState> = {
  id: 'line',
  label: 'Line',
  shortcut: 'l',
  title: 'Line (L) — Shift for ortho',
  hint: 'Click start · click end · Shift for ortho',
  icon: Icon,
  cursor: 'crosshair',
  snaps: true,

  createState: () => ({ start: null }),
  isDrawing: (s) => s.start !== null,
  orthoRef: (s) => s.start,
  scaleState: (s, f) => {
    if (s.start) s.start = { x: s.start.x * f, y: s.start.y * f };
  },

  onPointerDown(state, input, api) {
    if (!state.start) {
      state.start = { ...input.world };
      api.openDynInput(input.client);
      return;
    }
    const from = state.start;
    state.start = null;
    api.closeDynInput();
    api.edit(() => commitLine(api.doc, from.x, from.y, input.world.x, input.world.y, api.activeLayerId));
  },

  onDoubleClick(state, _input, api) {
    if (!state.start) return;
    state.start = null;
    api.closeDynInput();
    api.redraw();
  },

  onEscape(state, api) {
    state.start = null;
    api.closeDynInput();
    api.redraw();
  },

  drawPreview(state, scene) {
    if (!state.start) return;
    const { ctx, view, pointer, gridSize } = scene;
    const a = view.toScreen(state.start.x, state.start.y);
    const b = view.toScreen(pointer.world.x, pointer.world.y);
    ctx.save();
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = CANVAS.preview;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    const len = Math.hypot(pointer.world.x - state.start.x, pointer.world.y - state.start.y);
    if (len > gridSize * 0.5) {
      annotateSegment(scene, state.start.x, state.start.y, pointer.world.x, pointer.world.y);
    }
  },

  dyn: {
    fields: () => [
      { key: 'len', label: 'Len' },
      { key: 'ang', label: '∠°' },
    ],

    placeholder(state, key, _mode, cursor, units) {
      if (!state.start) return '';
      if (key === 'len') {
        return formatField(Math.hypot(cursor.x - state.start.x, cursor.y - state.start.y), units);
      }
      const deg = (Math.atan2(cursor.y - state.start.y, cursor.x - state.start.x) * 180) / Math.PI;
      return deg.toFixed(0);
    },

    resolve(state, values, _mode, cursor) {
      if (!state.start) return null;
      const len = values.len;
      if (len === null || len === undefined || len <= 0) return null;
      const ang = values.ang;
      let dx: number;
      let dy: number;
      if (ang !== null && ang !== undefined) {
        const t = (ang * Math.PI) / 180;
        dx = Math.cos(t);
        dy = Math.sin(t);
      } else {
        // No angle typed — keep the direction the cursor is pointing. With the
        // cursor still on the start point there is no direction yet, so fall
        // back to +X rather than collapsing the line to nothing.
        dx = cursor.x - state.start.x;
        dy = cursor.y - state.start.y;
        const d = Math.hypot(dx, dy);
        if (d < 1e-9) {
          dx = 1;
          dy = 0;
        } else {
          dx /= d;
          dy /= d;
        }
      }
      return { x: state.start.x + len * dx, y: state.start.y + len * dy };
    },

    commit(state, point, api) {
      const from = state.start;
      if (!from) return;
      state.start = null;
      api.closeDynInput();
      api.edit(() => commitLine(api.doc, from.x, from.y, point.x, point.y, api.activeLayerId));
    },
  },
};
