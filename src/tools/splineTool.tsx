// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { CLOSE_LOOP_PX } from '../core/constants';
import type { Point } from '../core/types';
import { splineSegments } from '../geometry/spline/splineSegments';
import { commitSpline } from '../model/commits/commitSpline';
import { closeLoopTarget } from '../render/closeLoopTarget';
import { dot } from '../render/dot';
import { CANVAS } from '../render/palette';
import type { Tool, ToolApi } from './types';

interface SplineState {
  pts: Point[];
}

const Icon = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M2 13 C4 13 3 5 7 6 S12 10 14 3" fill="none" />
  </svg>
);

function distToFirst(state: SplineState, api: ToolApi, screen: Point): number {
  const first = state.pts[0];
  if (!first) return Infinity;
  const s = api.view.toScreen(first.x, first.y);
  return Math.hypot(screen.x - s.x, screen.y - s.y);
}

/**
 * A smooth curve through the clicked points. On commit it is flattened into
 * line segments, since the graph model has no spline entity.
 */
export const splineTool: Tool<SplineState> = {
  id: 'spline',
  label: 'Curve',
  shortcut: 'v',
  title: 'Curve (V)',
  hint: 'Click points · click first or double-click to close',
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
      api.edit(() => commitSpline(api.doc, pts, true, 24, api.activeLayerId));
      api.showHint('Curve closed.', 3000);
      return;
    }
    state.pts.push({ ...input.world });
    api.redraw();
  },

  onDoubleClick(state, _input, api) {
    if (state.pts.length < 2) return;
    const pts = state.pts;
    state.pts = [];
    api.edit(() => commitSpline(api.doc, pts, false, 24, api.activeLayerId));
  },

  onEscape(state, api) {
    state.pts = [];
    api.redraw();
  },

  drawPreview(state, scene) {
    if (!state.pts.length) return;
    const { ctx, view, pointer } = scene;
    const segs = splineSegments([...state.pts, pointer.world], false);

    if (segs.length) {
      ctx.save();
      ctx.strokeStyle = CANVAS.preview;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      const start = view.toScreen(segs[0]!.from.x, segs[0]!.from.y);
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      for (const seg of segs) {
        const c1 = view.toScreen(seg.cp1.x, seg.cp1.y);
        const c2 = view.toScreen(seg.cp2.x, seg.cp2.y);
        const end = view.toScreen(seg.to.x, seg.to.y);
        ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, end.x, end.y);
      }
      ctx.stroke();
      ctx.restore();
    }

    for (const p of state.pts) {
      const s = view.toScreen(p.x, p.y);
      dot(ctx, s.x, s.y, 4, CANVAS.preview);
    }
    if (state.pts.length >= 3) closeLoopTarget(scene, state.pts[0]!.x, state.pts[0]!.y);
  },
};
