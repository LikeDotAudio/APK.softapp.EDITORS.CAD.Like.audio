// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { TAU } from '../core/constants';
import type { Point } from '../core/types';
import { commitEllipse } from '../model/commits/commitEllipse';
import { annotateEllipse } from '../render/dimensions/annotateEllipse';
import { CANVAS } from '../render/palette';
import type { Tool } from './types';

interface EllipseState {
  centre: Point | null;
}

const Icon = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <ellipse cx="8" cy="8" rx="6" ry="3.5" />
  </svg>
);

/** Unlike circles, ellipses have no arc representation here — they flatten to segments. */
export const ellipseTool: Tool<EllipseState> = {
  id: 'ellipse',
  label: 'Ellipse',
  shortcut: 'e',
  title: 'Ellipse (E)',
  hint: 'Click centre · click corner of bounding box',
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
      return;
    }
    const centre = state.centre;
    const rx = Math.abs(input.world.x - centre.x);
    const ry = Math.abs(input.world.y - centre.y);
    state.centre = null;
    api.edit(() => commitEllipse(api.doc, centre.x, centre.y, rx, ry, 96, api.activeLayerId));
  },

  onDoubleClick(state, _input, api) {
    if (!state.centre) return;
    state.centre = null;
    api.redraw();
  },

  onEscape(state, api) {
    state.centre = null;
    api.redraw();
  },

  drawPreview(state, scene) {
    if (!state.centre) return;
    const { ctx, view, pointer, gridSize } = scene;
    const rx = Math.abs(pointer.world.x - state.centre.x);
    const ry = Math.abs(pointer.world.y - state.centre.y);
    const c = view.toScreen(state.centre.x, state.centre.y);
    ctx.save();
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = CANVAS.preview;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, rx * view.zoom, ry * view.zoom, 0, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    if (rx > gridSize * 0.5 || ry > gridSize * 0.5) {
      annotateEllipse(scene, state.centre.x, state.centre.y, rx, ry);
    }
  },
};
