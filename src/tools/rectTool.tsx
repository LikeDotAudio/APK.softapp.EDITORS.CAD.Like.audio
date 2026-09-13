// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Point } from '../core/types';
import { commitRect } from '../model/commits/commitRect';
import { formatField } from '../model/units/formatField';
import { annotateRect } from '../render/dimensions/annotateRect';
import { CANVAS } from '../render/palette';
import type { Tool } from './types';

interface RectState {
  start: Point | null;
}

const Icon = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="4" width="12" height="8" />
  </svg>
);

export const rectTool: Tool<RectState> = {
  id: 'rect',
  label: 'Rect',
  shortcut: 'r',
  title: 'Rect (R)',
  hint: 'Click corner · click opposite corner',
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
    api.edit(() => commitRect(api.doc, from.x, from.y, input.world.x, input.world.y, api.activeLayerId));
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
    const { ctx, view, pointer } = scene;
    const a = view.toScreen(state.start.x, state.start.y);
    const b = view.toScreen(pointer.world.x, pointer.world.y);
    ctx.save();
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = CANVAS.preview;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(
      Math.min(a.x, b.x),
      Math.min(a.y, b.y),
      Math.abs(b.x - a.x),
      Math.abs(b.y - a.y),
    );
    ctx.setLineDash([]);
    ctx.restore();

    annotateRect(scene, state.start.x, state.start.y, pointer.world.x, pointer.world.y);
  },

  dyn: {
    fields: () => [
      { key: 'w', label: 'W' },
      { key: 'h', label: 'H' },
    ],

    placeholder(state, key, _mode, cursor, units) {
      if (!state.start) return '';
      const dx = Math.abs(cursor.x - state.start.x);
      const dy = Math.abs(cursor.y - state.start.y);
      return formatField(key === 'w' ? dx : dy, units);
    },

    resolve(state, values, _mode, cursor) {
      if (!state.start) return null;
      const w = values.w;
      const h = values.h;
      if ((w === null || w === undefined) && (h === null || h === undefined)) return null;
      // Typed sizes keep the quadrant the cursor is currently in.
      let x = cursor.x;
      let y = cursor.y;
      if (w !== null && w !== undefined) {
        x = state.start.x + (Math.sign(cursor.x - state.start.x) || 1) * Math.abs(w);
      }
      if (h !== null && h !== undefined) {
        y = state.start.y + (Math.sign(cursor.y - state.start.y) || 1) * Math.abs(h);
      }
      return { x, y };
    },

    commit(state, point, api) {
      const from = state.start;
      if (!from) return;
      state.start = null;
      api.closeDynInput();
      api.edit(() => commitRect(api.doc, from.x, from.y, point.x, point.y, api.activeLayerId));
    },
  },
};
