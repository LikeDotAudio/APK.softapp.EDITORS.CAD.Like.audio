// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Point } from '../core/types';
import type { Tool } from './types';

interface FillState {
  points: Point[];
  type: 'solid' | 'hatch';
}

const Icon = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M2 14h12l-2-10H4L2 14z" />
    <path d="M4.5 14l2-10M8.5 14l2-10" strokeDasharray="1.5 1.5" />
  </svg>
);

export const fillTool: Tool<FillState> = {
  id: 'fill',
  label: 'Fill / Hatch',
  shortcut: 'h',
  title: 'Fill / Hatch (H) — Click points to define a filled boundary. Double-click or click start point to close and create fill.',
  hint: 'Click points to define fill region · Double-click to close and apply fill · Esc to cancel',
  icon: Icon,
  cursor: 'crosshair',
  snaps: true,

  createState: () => ({
    points: [],
    type: 'solid',
  }),

  onPointerDown(state, input, api) {
    // If clicking close to the first point with at least 3 points, close it
    if (state.points.length >= 3) {
      const p0 = state.points[0];
      const dist = Math.hypot(input.world.x - p0.x, input.world.y - p0.y);
      if (dist < 0.25) {
        api.edit(() => {
          api.doc.addFill([...state.points], state.type, api.activeLayerId);
          return true;
        });
        state.points = [];
        api.showHint('Fill created.', 2000);
        api.redraw();
        return;
      }
    }

    state.points.push(input.world);
    api.redraw();
  },

  onDoubleClick(state, _input, api) {
    if (state.points.length >= 3) {
      api.edit(() => {
        api.doc.addFill([...state.points], state.type, api.activeLayerId);
        return true;
      });
      api.showHint('Fill created.', 2000);
    }
    state.points = [];
    api.redraw();
  },

  onEscape(state, api) {
    state.points = [];
    api.redraw();
  },

  drawPreview(state, scene) {
    const { ctx, view, pointer } = scene;
    if (state.points.length === 0) return;

    const allPts = [...state.points, pointer.world];
    const screenPts = allPts.map((p) => view.toScreen(p.x, p.y));

    ctx.save();
    ctx.beginPath();
    screenPts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.closePath();

    ctx.fillStyle = '#f4902c';
    ctx.globalAlpha = 0.25;
    ctx.fill();

    ctx.strokeStyle = '#f4902c';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.globalAlpha = 0.9;
    ctx.stroke();

    // Mark vertices
    for (const p of screenPts) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
    }

    ctx.restore();
  },
};
