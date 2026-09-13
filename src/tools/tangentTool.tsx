// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Point } from '../core/types';
import { commitLine } from '../model/commits/commitLine';
import { CANVAS } from '../render/palette';
import type { Tool } from './types';

interface TangentState {
  start: Point | null;
}

const Icon = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="10" cy="6" r="4" />
    <line x1="2" y1="14" x2="14" y2="2" />
  </svg>
);

function getTangentPoint(
  p: Point,
  cx: number,
  cy: number,
  r: number,
  cursor: Point,
): Point | null {
  const dx = cx - p.x;
  const dy = cy - p.y;
  const d2 = dx * dx + dy * dy;
  const r2 = r * r;

  if (d2 <= r2) return null; // Point inside circle

  const d = Math.sqrt(d2);
  const L = Math.sqrt(d2 - r2);

  // Angle from p to center
  const alpha = Math.atan2(dy, dx);
  // Angle of tangent offset
  const beta = Math.asin(r / d);

  const t1Angle = alpha + beta;
  const t2Angle = alpha - beta;

  const t1 = { x: p.x + L * Math.cos(t1Angle), y: p.y + L * Math.sin(t1Angle) };
  const t2 = { x: p.x + L * Math.cos(t2Angle), y: p.y + L * Math.sin(t2Angle) };

  // Pick tangent point closer to cursor
  const dist1 = Math.hypot(cursor.x - t1.x, cursor.y - t1.y);
  const dist2 = Math.hypot(cursor.x - t2.x, cursor.y - t2.y);

  return dist1 < dist2 ? t1 : t2;
}

export const tangentTool: Tool<TangentState> = {
  id: 'tangent',
  label: 'Tangent Line',
  shortcut: 't',
  title: 'Tangent Line (T) — Line tangent from a point to a circle/arc',
  hint: 'Click start point · hover circle/arc & click to construct tangent line',
  icon: Icon,
  cursor: 'crosshair',
  snaps: true,

  createState: () => ({ start: null }),
  isDrawing: (s) => s.start !== null,

  onPointerDown(state, input, api) {
    if (!state.start) {
      state.start = { ...input.world };
      return;
    }

    const edgeId = api.doc.hitEdgeAt(input.world.x, input.world.y, api.view.zoom);
    if (edgeId === null) return;

    const edge = api.doc.edge(edgeId);
    if (!edge || edge.type !== 'arc') return;

    const p = state.start;
    const tanPt = getTangentPoint(p, edge.cx, edge.cy, edge.r, input.world);
    if (!tanPt) {
      api.showHint('Point is inside circle; no tangent exists.', 4000);
      return;
    }

    state.start = null;
    api.edit(() =>
      commitLine(api.doc, p.x, p.y, tanPt.x, tanPt.y, api.activeLayerId),
    );
    api.showHint('Constructed tangent line.', 3000);
  },

  drawPreview(state, scene) {
    if (!state.start) return;
    const { ctx, view, doc, pointer } = scene;
    const p = state.start;

    const edgeId = doc.hitEdgeAt(pointer.world.x, pointer.world.y, view.zoom);
    let endPt = pointer.world;

    if (edgeId !== null) {
      const edge = doc.edge(edgeId);
      if (edge && edge.type === 'arc') {
        const tanPt = getTangentPoint(p, edge.cx, edge.cy, edge.r, pointer.world);
        if (tanPt) endPt = tanPt;
      }
    }

    const s1 = view.toScreen(p.x, p.y);
    const s2 = view.toScreen(endPt.x, endPt.y);

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
};
