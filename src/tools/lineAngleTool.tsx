// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Point } from '../core/types';
import { commitLine } from '../model/commits/commitLine';
import { formatField } from '../model/units/formatField';
import { CANVAS } from '../render/palette';
import type { Tool } from './types';

interface LineAngleState {
  start: Point | null;
  angleDeg: number;
  length: number;
}

const Icon = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <line x1="2" y1="14" x2="14" y2="14" />
    <line x1="2" y1="14" x2="12" y2="4" />
    <path d="M6 14 A 4 4 0 0 0 5 11" />
  </svg>
);

export const lineAngleTool: Tool<LineAngleState> = {
  id: 'lineAngle',
  label: 'Line Angle',
  shortcut: 'a',
  title: 'Line Angle (A) — Draw line at a fixed angle & length',
  hint: 'Type angle & length in box, then click start position on canvas',
  icon: Icon,
  cursor: 'crosshair',
  snaps: true,

  createState: () => ({ start: null, angleDeg: 30, length: 2.0 }),
  isDrawing: () => true,

  onPointerDown(state, input, api) {
    const rad = (state.angleDeg * Math.PI) / 180;
    const endX = input.world.x + state.length * Math.cos(rad);
    const endY = input.world.y + state.length * Math.sin(rad);

    api.edit(() =>
      commitLine(api.doc, input.world.x, input.world.y, endX, endY, api.activeLayerId),
    );
    api.showHint(`Created line at ${state.angleDeg}° with length ${state.length}`, 3000);
  },

  onPointerMove(_state, input, api) {
    api.openDynInput(input.client);
  },

  drawPreview(state, scene) {
    const { ctx, view, pointer } = scene;
    const rad = (state.angleDeg * Math.PI) / 180;
    const endX = pointer.world.x + state.length * Math.cos(rad);
    const endY = pointer.world.y + state.length * Math.sin(rad);

    const s1 = view.toScreen(pointer.world.x, pointer.world.y);
    const s2 = view.toScreen(endX, endY);

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
    fields: () => [
      { key: 'ang', label: '∠°' },
      { key: 'len', label: 'Len' },
    ],

    placeholder(state, key, _mode, _cursor, units) {
      return key === 'ang' ? `${state.angleDeg}` : formatField(state.length, units);
    },

    resolve(state, values) {
      if (values.ang !== null && values.ang !== undefined) {
        state.angleDeg = values.ang;
      }
      if (values.len !== null && values.len !== undefined && values.len > 0) {
        state.length = values.len;
      }
      return null;
    },

    commit() {},
  },
};
