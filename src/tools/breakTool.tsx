// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { breakCircle } from '../model/breakCircle/breakCircle';
import { findCircleAt } from '../model/breakCircle/findCircleAt';
import { dot } from '../render/dot';
import { CANVAS } from '../render/palette';
import type { Tool } from './types';

interface BreakState {
  groupId: number | null;
  firstAngle: number | null;
}

const Icon = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M2 8 A6 6 0 0 1 7 2.3" />
    <path d="M14 8 A6 6 0 0 1 9 13.7" />
  </svg>
);

/**
 * Cut a section out of a circle. Both remaining pieces stay true arcs, which
 * is the whole point — a tessellated circle would export as dozens of lines.
 */
export const breakTool: Tool<BreakState> = {
  id: 'break',
  label: 'Break',
  shortcut: 'b',
  title:
    'Break (B) — click a circle, then click two points. The CCW section is removed. Remaining pieces stay true arcs.',
  hint: 'Click a point on a circle, then click another · CCW section between them is removed',
  icon: Icon,
  cursor: 'crosshair',
  snaps: false,

  createState: () => ({ groupId: null, firstAngle: null }),

  onPointerDown(state, input, api) {
    const { x, y } = input.rawWorld;

    if (state.groupId === null) {
      const target = findCircleAt(api.doc, x, y, api.view.zoom);
      if (!target) {
        api.showHint('Break tool works on circles — click closer to one.', 3500);
        return;
      }
      state.groupId = target.groupId;
      state.firstAngle = Math.atan2(y - target.prim.cy, x - target.prim.cx);
      api.showHint('Now click the second point. Section CCW from the first click is removed.', 0);
      api.redraw();
      return;
    }

    const prim = api.doc.groupPrimitives.get(state.groupId);
    if (!prim) {
      state.groupId = null;
      state.firstAngle = null;
      return;
    }
    const groupId = state.groupId;
    const firstAngle = state.firstAngle ?? 0;
    const secondAngle = Math.atan2(y - prim.cy, x - prim.cx);
    state.groupId = null;
    state.firstAngle = null;
    api.edit(() => breakCircle(api.doc, groupId, firstAngle, secondAngle));
    api.showHint('Section removed. Click another circle to break again.', 3500);
  },

  onEscape(state, api) {
    state.groupId = null;
    state.firstAngle = null;
    api.redraw();
  },

  drawPreview(state, scene) {
    const { ctx, view, doc, pointer } = scene;
    dot(ctx, pointer.screen.x, pointer.screen.y, 3, CANVAS.cursorDot);
    if (state.groupId === null || state.firstAngle === null) return;

    const prim = doc.groupPrimitives.get(state.groupId);
    if (!prim) return;

    const centre = view.toScreen(prim.cx, prim.cy);
    const secondAngle = Math.atan2(pointer.world.y - prim.cy, pointer.world.x - prim.cx);
    ctx.save();
    ctx.strokeStyle = 'rgba(220,38,38,.85)';
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    // Screen Y is flipped, so the world-CCW section is swept the other way here.
    ctx.arc(centre.x, centre.y, prim.r * view.zoom, -state.firstAngle, -secondAngle, true);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    const px = prim.cx + prim.r * Math.cos(state.firstAngle);
    const py = prim.cy + prim.r * Math.sin(state.firstAngle);
    const s = view.toScreen(px, py);
    dot(ctx, s.x, s.y, 5, CANVAS.danger);
  },
};
