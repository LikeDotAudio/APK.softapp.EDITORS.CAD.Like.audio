// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Point } from '../core/types';
import { commitCircle } from '../model/commits/commitCircle';
import { formatField } from '../model/units/formatField';
import { CANVAS } from '../render/palette';
import type { Tool } from './types';

interface Circle2PState {
  p1: Point | null;
}

const Icon = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="8" cy="8" r="6" />
    <circle cx="2" cy="8" r="1" fill="currentColor" />
    <circle cx="14" cy="8" r="1" fill="currentColor" />
  </svg>
);

export const circle2pTool: Tool<Circle2PState> = {
  id: 'circle2p',
  label: 'Circle 2 Points',
  shortcut: '2',
  title: 'Circle 2 Points (2) — Circle defined by 2 opposite diameter points',
  hint: 'Click 1st diameter point · click 2nd diameter point',
  icon: Icon,
  cursor: 'crosshair',
  snaps: true,

  createState: () => ({ p1: null }),
  isDrawing: (s) => s.p1 !== null,

  onPointerDown(state, input, api) {
    if (!state.p1) {
      state.p1 = { ...input.world };
      api.openDynInput(input.client);
      return;
    }
    const p1 = state.p1;
    const p2 = input.world;
    const cx = (p1.x + p2.x) / 2;
    const cy = (p1.y + p2.y) / 2;
    const r = Math.hypot(p2.x - p1.x, p2.y - p1.y) / 2;

    state.p1 = null;
    api.closeDynInput();
    api.edit(() => commitCircle(api.doc, cx, cy, r, api.activeLayerId));
  },

  drawPreview(state, scene) {
    if (!state.p1) return;
    const { ctx, view, pointer } = scene;
    const p1 = state.p1;
    const p2 = pointer.world;
    const cx = (p1.x + p2.x) / 2;
    const cy = (p1.y + p2.y) / 2;
    const r = Math.hypot(p2.x - p1.x, p2.y - p1.y) / 2;

    const c = view.toScreen(cx, cy);
    ctx.save();
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = CANVAS.preview;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(c.x, c.y, r * view.zoom, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  },

  dyn: {
    fields: () => [{ key: 'diam', label: 'Ø' }],

    placeholder(state, _key, _mode, cursor, units) {
      if (!state.p1) return '';
      const d = Math.hypot(cursor.x - state.p1.x, cursor.y - state.p1.y);
      return formatField(d, units);
    },

    resolve(state, values, _mode, cursor) {
      if (!state.p1) return null;
      const d = values.diam;
      if (d === null || d === undefined || d <= 0) return null;
      let dx = cursor.x - state.p1.x;
      let dy = cursor.y - state.p1.y;
      const len = Math.hypot(dx, dy);
      if (len < 1e-9) {
        dx = 1;
        dy = 0;
      } else {
        dx /= len;
        dy /= len;
      }
      return { x: state.p1.x + d * dx, y: state.p1.y + d * dy };
    },

    commit(state, point, api) {
      const p1 = state.p1;
      if (!p1) return;
      const cx = (p1.x + point.x) / 2;
      const cy = (p1.y + point.y) / 2;
      const r = Math.hypot(point.x - p1.x, point.y - p1.y) / 2;
      state.p1 = null;
      api.closeDynInput();
      api.edit(() => commitCircle(api.doc, cx, cy, r, api.activeLayerId));
    },
  },
};
