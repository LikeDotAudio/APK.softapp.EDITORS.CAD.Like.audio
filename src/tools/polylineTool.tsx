// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { CLOSE_LOOP_PX } from '../core/constants';
import type { Point } from '../core/types';
import { commitPolyline } from '../model/commits/commitPolyline';
import { annotateSegment } from '../render/dimensions/annotateSegment';
import { closeLoopTarget } from '../render/closeLoopTarget';
import { dot } from '../render/dot';
import { CANVAS } from '../render/palette';
import type { Tool, ToolApi } from './types';

interface PolylineState {
  pts: Point[];
}

const Icon = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <polyline points="2,13 5,5 10,9 14,3" />
  </svg>
);

/** Screen distance from a point to the first vertex — used to detect "close the loop". */
function distToFirst(state: PolylineState, api: ToolApi, screen: Point): number {
  const first = state.pts[0];
  if (!first) return Infinity;
  const s = api.view.toScreen(first.x, first.y);
  return Math.hypot(screen.x - s.x, screen.y - s.y);
}

export const polylineTool: Tool<PolylineState> = {
  id: 'polyline',
  label: 'Polyline',
  shortcut: 'p',
  title: 'Polyline (P) — Shift for ortho',
  hint: 'Click points · click first or double-click to close · Shift for ortho',
  icon: Icon,
  cursor: 'crosshair',
  snaps: true,

  createState: () => ({ pts: [] }),
  isDrawing: (s) => s.pts.length > 0,
  orthoRef: (s) => s.pts[s.pts.length - 1] ?? null,
  scaleState: (s, f) => {
    s.pts = s.pts.map((p) => ({ x: p.x * f, y: p.y * f }));
  },

  onPointerDown(state, input, api) {
    if (state.pts.length >= 3 && distToFirst(state, api, input.screen) < CLOSE_LOOP_PX) {
      const pts = state.pts;
      state.pts = [];
      api.edit(() => commitPolyline(api.doc, pts, true, api.activeLayerId));
      api.showHint('Shape closed.', 3000);
      return;
    }
    state.pts.push({ ...input.world });
    api.redraw();
  },

  onDoubleClick(state, _input, api) {
    if (state.pts.length < 2) return;
    const pts = state.pts;
    state.pts = [];
    api.edit(() => commitPolyline(api.doc, pts, false, api.activeLayerId));
  },

  onEscape(state, api) {
    state.pts = [];
    api.redraw();
  },

  drawPreview(state, scene) {
    if (!state.pts.length) return;
    const { ctx, view, pointer, gridSize } = scene;
    const pts = [...state.pts, pointer.world];

    ctx.save();
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = CANVAS.preview;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const first = view.toScreen(pts[0]!.x, pts[0]!.y);
    ctx.moveTo(first.x, first.y);
    for (let i = 1; i < pts.length; i++) {
      const s = view.toScreen(pts[i]!.x, pts[i]!.y);
      ctx.lineTo(s.x, s.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    const a = pts[pts.length - 2];
    const b = pts[pts.length - 1];
    if (a && b && Math.hypot(b.x - a.x, b.y - a.y) > gridSize * 0.5) {
      annotateSegment(scene, a.x, a.y, b.x, b.y);
    }

    for (const p of state.pts) {
      const s = view.toScreen(p.x, p.y);
      dot(ctx, s.x, s.y, 4, CANVAS.preview);
    }
    if (state.pts.length >= 3) closeLoopTarget(scene, state.pts[0]!.x, state.pts[0]!.y);
  },
};
