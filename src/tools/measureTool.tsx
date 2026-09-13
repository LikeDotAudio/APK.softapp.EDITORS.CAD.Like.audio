// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Point } from '../core/types';
import { formatLength } from '../model/units/formatLength';
import { dot } from '../render/dot';
import { CANVAS, FONT } from '../render/palette';
import type { Tool, ToolApi } from './types';

interface MeasureState {
  p1: Point | null;
  p2: Point | null;
}

const Icon = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <line x1="2" y1="14" x2="14" y2="2" />
    <line x1="2" y1="11" x2="5" y2="14" />
    <line x1="5" y1="8" x2="8" y2="11" />
    <line x1="8" y1="5" x2="11" y2="8" />
    <line x1="11" y1="2" x2="14" y2="5" />
  </svg>
);

/** "12.500 in (8.000 × 9.600)" — the deltas only appear on a diagonal. */
function readout(a: Point, b: Point, api: ToolApi): string {
  const dist = Math.hypot(b.x - a.x, b.y - a.y);
  const dx = Math.abs(b.x - a.x);
  const dy = Math.abs(b.y - a.y);
  let text = `${formatLength(dist, api.units)} ${api.units}`;
  if (dx > 1e-6 && dy > 1e-6) {
    text += `  (${formatLength(dx, api.units)} × ${formatLength(dy, api.units)})`;
  }
  return text;
}

export const measureTool: Tool<MeasureState> = {
  id: 'measure',
  label: 'Measure',
  shortcut: 'm',
  title: 'Measure (M)',
  hint: 'Click first point · click second point to lock · Esc to clear',
  icon: Icon,
  cursor: 'crosshair',
  snaps: true,
  // The measure tool draws its own green cursor dot, so the snap marker would
  // just sit on top of it.
  showsSnapIndicator: false,

  createState: () => ({ p1: null, p2: null }),
  scaleState: (s, f) => {
    if (s.p1) s.p1 = { x: s.p1.x * f, y: s.p1.y * f };
    if (s.p2) s.p2 = { x: s.p2.x * f, y: s.p2.y * f };
  },

  onPointerMove(state, input, api) {
    if (state.p1 && !state.p2) api.setMeasurement(`📏 ${readout(state.p1, input.world, api)}`);
  },

  onPointerDown(state, input, api) {
    if (!state.p1 || state.p2) {
      state.p1 = { ...input.world };
      state.p2 = null;
      api.setMeasurement(null);
    } else {
      const p2 = { ...input.world };
      state.p2 = p2;
      const p1 = state.p1;
      
      // Commit line geometry to the drawing on the active layer
      if (Math.hypot(p2.x - p1.x, p2.y - p1.y) > 1e-6) {
        api.edit(() => {
          const groupId = api.doc.newGroupId();
          const v1 = api.doc.addVertex(p1.x, p1.y);
          const v2 = api.doc.addVertex(p2.x, p2.y);
          api.doc.addLineEdge(v1, v2, groupId, api.activeLayerId);
          return true;
        });
        api.showHint(`Added dimension line to layer "${api.activeLayerId}".`, 2500);
      }
      
      api.setMeasurement(`📏 ${readout(p1, p2, api)}`);
    }
    api.redraw();
  },

  onEscape(state, api) {
    state.p1 = null;
    state.p2 = null;
    api.setMeasurement(null);
    api.redraw();
  },

  drawPreview(state, scene) {
    const { ctx, view, pointer, units } = scene;
    dot(ctx, pointer.screen.x, pointer.screen.y, 4, CANVAS.measure);
    if (!state.p1) return;

    const s1 = view.toScreen(state.p1.x, state.p1.y);
    const end = state.p2 ?? pointer.world;
    const s2 = view.toScreen(end.x, end.y);

    dot(ctx, s1.x, s1.y, 5, CANVAS.measure);
    ctx.save();
    ctx.strokeStyle = CANVAS.measure;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(s1.x, s1.y);
    ctx.lineTo(s2.x, s2.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    if (state.p2) dot(ctx, s2.x, s2.y, 5, CANVAS.measure);

    const dist = Math.hypot(end.x - state.p1.x, end.y - state.p1.y);
    const dx = Math.abs(end.x - state.p1.x);
    const dy = Math.abs(end.y - state.p1.y);
    let label = `${formatLength(dist, units)} ${units}`;
    if (dx > 1e-6 && dy > 1e-6) {
      label += `  (${formatLength(dx, units)} × ${formatLength(dy, units)})`;
    }

    // Offset the label along the segment normal so it never sits on the line.
    const len = Math.hypot(s2.x - s1.x, s2.y - s1.y);
    const nx = len > 0 ? -(s2.y - s1.y) / len : 0;
    const ny = len > 0 ? (s2.x - s1.x) / len : 1;
    const lx = (s1.x + s2.x) / 2 + nx * 22;
    const ly = (s1.y + s2.y) / 2 + ny * 22;

    ctx.save();
    ctx.font = FONT.measure;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const tw = ctx.measureText(label).width;
    ctx.fillStyle = CANVAS.measureFill;
    ctx.beginPath();
    ctx.roundRect(lx - tw / 2 - 5, ly - 10, tw + 10, 20, 4);
    ctx.fill();
    ctx.fillStyle = CANVAS.white;
    ctx.fillText(label, lx, ly);
    ctx.restore();
  },
};
