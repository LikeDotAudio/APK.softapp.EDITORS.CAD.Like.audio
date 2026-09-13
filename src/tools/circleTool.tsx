// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { TAU } from '../core/constants';
import type { Point } from '../core/types';
import { commitCircle } from '../model/commits/commitCircle';
import { formatField } from '../model/units/formatField';
import { annotateCircle } from '../render/dimensions/annotateCircle';
import { CANVAS } from '../render/palette';
import type { Tool } from './types';

interface CircleState {
  centre: Point | null;
}

const Icon = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="8" cy="8" r="5.5" />
  </svg>
);

/** Circles are stored as true arcs, so they export as a real DXF CIRCLE. */
export const circleTool: Tool<CircleState> = {
  id: 'circle',
  label: 'Circle',
  shortcut: 'c',
  title: 'Circle (C) — exports as a true CIRCLE in DXF',
  hint: 'Click centre · click edge',
  icon: Icon,
  cursor: 'crosshair',
  snaps: true,

  createState: () => ({ centre: null }),
  isDrawing: (s) => s.centre !== null,
  orthoRef: (s) => s.centre,
  scaleState: (s, f) => {
    if (s.centre) s.centre = { x: s.centre.x * f, y: s.centre.y * f };
  },

  onPointerDown(state, input, api) {
    if (!state.centre) {
      state.centre = { ...input.world };
      api.openDynInput(input.client);
      return;
    }
    const centre = state.centre;
    const r = Math.hypot(input.world.x - centre.x, input.world.y - centre.y);
    state.centre = null;
    api.closeDynInput();
    api.edit(() => commitCircle(api.doc, centre.x, centre.y, r, api.activeLayerId));
  },

  onDoubleClick(state, _input, api) {
    if (!state.centre) return;
    state.centre = null;
    api.closeDynInput();
    api.redraw();
  },

  onEscape(state, api) {
    state.centre = null;
    api.closeDynInput();
    api.redraw();
  },

  drawPreview(state, scene) {
    if (!state.centre) return;
    const { ctx, view, pointer, gridSize } = scene;
    const r = Math.hypot(pointer.world.x - state.centre.x, pointer.world.y - state.centre.y);
    const c = view.toScreen(state.centre.x, state.centre.y);
    ctx.save();
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = CANVAS.preview;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(c.x, c.y, r * view.zoom, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    if (r > gridSize * 0.5) annotateCircle(scene, state.centre.x, state.centre.y, r);
  },

  dyn: {
    fields: () => [{ key: 'r', label: '' }],
    modes: ['r', 'd'] as const,
    modeLabel: (mode) => (mode === 'd' ? '⌀' : 'R'),

    placeholder(state, _key, mode, cursor, units) {
      if (!state.centre) return '';
      let r = Math.hypot(cursor.x - state.centre.x, cursor.y - state.centre.y);
      if (mode === 'd') r *= 2;
      return formatField(r, units);
    },

    resolve(state, values, mode, cursor) {
      if (!state.centre) return null;
      let r = values.r;
      if (r === null || r === undefined || r <= 0) return null;
      if (mode === 'd') r /= 2;
      // Any direction gives the same circle; +X is the fallback when the
      // cursor has not left the centre yet.
      let dx = cursor.x - state.centre.x;
      let dy = cursor.y - state.centre.y;
      const d = Math.hypot(dx, dy);
      if (d < 1e-9) {
        dx = 1;
        dy = 0;
      } else {
        dx /= d;
        dy /= d;
      }
      return { x: state.centre.x + r * dx, y: state.centre.y + r * dy };
    },

    commit(state, point, api) {
      const centre = state.centre;
      if (!centre) return;
      const r = Math.hypot(point.x - centre.x, point.y - centre.y);
      state.centre = null;
      api.closeDynInput();
      api.edit(() => commitCircle(api.doc, centre.x, centre.y, r, api.activeLayerId));
    },
  },
};
