// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Point } from '../core/types';
import { commitCircle } from '../model/commits/commitCircle';
import { CANVAS } from '../render/palette';
import type { Tool } from './types';

interface Circle3PState {
  pts: Point[];
}

const Icon = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="8" cy="8" r="6" />
    <circle cx="2" cy="8" r="1" fill="currentColor" />
    <circle cx="8" cy="2" r="1" fill="currentColor" />
    <circle cx="14" cy="8" r="1" fill="currentColor" />
  </svg>
);

function getCircleFrom3Points(p1: Point, p2: Point, p3: Point): { cx: number; cy: number; r: number } | null {
  const A = p2.x - p1.x;
  const B = p2.y - p1.y;
  const C = p3.x - p1.x;
  const D = p3.y - p1.y;

  const E = A * (p1.x + p2.x) + B * (p1.y + p2.y);
  const F = C * (p1.x + p3.x) + D * (p1.y + p3.y);
  const G = 2 * (A * (p3.y - p2.y) - B * (p3.x - p2.x));

  if (Math.abs(G) < 1e-9) return null; // Collinear points

  const cx = (D * E - B * F) / G;
  const cy = (A * F - C * E) / G;
  const r = Math.hypot(p1.x - cx, p1.y - cy);

  return { cx, cy, r };
}

export const circle3pTool: Tool<Circle3PState> = {
  id: 'circle3p',
  label: 'Circle 3 Points',
  shortcut: '3',
  title: 'Circle 3 Points (3) — Circle defined by 3 perimeter points',
  hint: 'Click 1st point · 2nd point · 3rd point on circle perimeter',
  icon: Icon,
  cursor: 'crosshair',
  snaps: true,

  createState: () => ({ pts: [] }),
  isDrawing: (s) => s.pts.length > 0,

  onPointerDown(state, input, api) {
    state.pts.push({ ...input.world });

    if (state.pts.length === 3) {
      const circle = getCircleFrom3Points(state.pts[0], state.pts[1], state.pts[2]);
      state.pts = [];

      if (circle) {
        api.edit(() => commitCircle(api.doc, circle.cx, circle.cy, circle.r, api.activeLayerId));
      } else {
        api.showHint('Points are collinear; cannot construct circle.', 4000);
      }
      return;
    }

    api.redraw();
  },

  drawPreview(state, scene) {
    if (state.pts.length === 0) return;
    const { ctx, view, pointer } = scene;
    const pts = [...state.pts, pointer.world];

    if (pts.length === 3) {
      const circle = getCircleFrom3Points(pts[0], pts[1], pts[2]);
      if (circle) {
        const c = view.toScreen(circle.cx, circle.cy);
        ctx.save();
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = CANVAS.preview;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(c.x, c.y, circle.r * view.zoom, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }
  },
};
