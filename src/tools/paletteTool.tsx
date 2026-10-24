// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Point } from '../core/types';
import { pointInPolygon } from '../geometry/polygon/pointInPolygon';
import { addPaletteFill } from '../model/palette/addPaletteFill';
import { closedLoopAt } from '../model/palette/closedLoopAt';
import { paletteBlockDefinition } from '../model/palette/paletteBlockDefinition';
import { placePaletteBlock } from '../model/palette/placePaletteBlock';
import { CANVAS } from '../render/palette';
import { strokeHatch } from '../render/fills/strokeHatch';
import type { Tool, ToolApi } from './types';

/**
 * THE HOST'S MATERIALS, PUT ON THE SHEET
 *
 * One tool for both kinds of palette item, because the panel arms an ITEM and
 * the item decides the gesture:
 *
 *   a product (it has a size)  click → the block, true size, centred there
 *   a finish                   drag a rectangle → that region painted;
 *                              click inside a closed outline → that outline
 *                              painted; click elsewhere → click-click rectangle
 *
 * Everything lands on the active layer — the elevation the host jumped the
 * sheet to — through `edit()`, so it is one undo step and Symmetrical Mode
 * mirrors it like anything else drawn. Del removes the palette patch under
 * the cursor, because a fill cannot be picked with the Select tool.
 *
 * Not on the toolbar: with no palette armed it has nothing to do.
 */
interface PaletteState {
  start: Point | null;
  startScreen: Point | null;
  /** True between the first click of a click-click rectangle and the second. */
  clicking: boolean;
  hover: Point | null;
}

/** Screen pixels a press must travel to count as a drag rather than a click. */
const DRAG_PX = 4;

const Icon = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="2" width="5" height="5" />
    <rect x="9" y="2" width="5" height="5" />
    <rect x="2" y="9" width="5" height="5" />
    <rect x="9" y="9" width="5" height="5" />
  </svg>
);

function rect(a: Point, b: Point): Point[] {
  return [
    { x: a.x, y: a.y },
    { x: b.x, y: a.y },
    { x: b.x, y: b.y },
    { x: a.x, y: b.y },
  ];
}

function paintRegion(api: ToolApi, points: Point[]): void {
  const item = api.paletteItem;
  if (!item) return;
  api.edit(() => addPaletteFill(api.doc, item, points, api.activeLayerId) !== null);
  api.showHint(`Painted ${item.name}.`, 1500);
}

function reset(state: PaletteState): void {
  state.start = null;
  state.startScreen = null;
  state.clicking = false;
}

export const paletteTool: Tool<PaletteState> = {
  id: 'palette',
  label: 'Palette',
  shortcut: '',
  title: 'Palette — place the host\'s materials',
  hint: 'Pick a material in the Palette panel',
  icon: Icon,
  cursor: 'crosshair',
  snaps: true,

  createState: () => ({ start: null, startScreen: null, clicking: false, hover: null }),
  isDrawing: (s) => s.start !== null,
  orthoRef: (s) => s.start,
  scaleState: (s, f) => {
    if (s.start) s.start = { x: s.start.x * f, y: s.start.y * f };
  },

  onPointerDown(state, input, api) {
    const item = api.paletteItem;
    if (!item) {
      api.showHint('Pick a material in the Palette panel first.', 2000);
      return;
    }
    if (item.size) {
      api.edit(() => placePaletteBlock(api.doc, item, api.units, input.world, 0, api.activeLayerId) !== null);
      api.showHint(`Placed ${item.name}.`, 1500);
      return;
    }
    if (state.clicking && state.start) {
      const from = state.start;
      reset(state);
      if (from.x !== input.world.x && from.y !== input.world.y) paintRegion(api, rect(from, input.world));
      return;
    }
    state.start = { ...input.world };
    state.startScreen = { ...input.screen };
  },

  onPointerMove(state, input, api) {
    state.hover = input.world;
    api.redraw();
  },

  onPointerUp(state, input, api) {
    if (!state.start || !state.startScreen || state.clicking) return;
    const from = state.start;
    const moved = Math.hypot(input.screen.x - state.startScreen.x, input.screen.y - state.startScreen.y);
    if (moved > DRAG_PX) {
      reset(state);
      if (from.x !== input.world.x && from.y !== input.world.y) paintRegion(api, rect(from, input.world));
      return;
    }
    // A click, not a drag: fill the outline it landed in, or start a click-click rectangle.
    const loop = closedLoopAt(api.doc, input.rawWorld, api.activeLayerId);
    if (loop) {
      reset(state);
      paintRegion(api, loop);
      return;
    }
    state.clicking = true;
  },

  onEscape(state, api) {
    reset(state);
    api.redraw();
  },

  onDelete(state, api) {
    const p = state.hover;
    if (!p) return;
    let victim: number | null = null;
    for (const f of api.doc.fills.values()) {
      if (f.paletteId && f.layerId === api.activeLayerId && !f.protected && pointInPolygon(p.x, p.y, f.points)) victim = f.id;
    }
    if (victim === null) return;
    const id = victim;
    api.edit(() => {
      api.doc.removeFill(id);
      return true;
    });
    api.showHint('Removed the patch under the cursor.', 1500);
  },

  drawPreview(state, scene) {
    const item = scene.paletteItem;
    if (!item) return;
    const { ctx, view, pointer } = scene;
    ctx.save();
    if (item.size) {
      const def = paletteBlockDefinition(item, scene.units);
      const pts = def?.fills?.[0]?.points;
      if (pts) {
        const scr = pts.map((p) => view.toScreen(pointer.world.x + p.x, pointer.world.y + p.y));
        ctx.globalAlpha = 0.6;
        strokeHatch(ctx, scr, item.hatch, item.color);
        ctx.beginPath();
        scr.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
        ctx.closePath();
        ctx.globalAlpha = 0.9;
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = item.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    } else if (state.start) {
      const scr = rect(state.start, pointer.world).map((p) => view.toScreen(p.x, p.y));
      ctx.globalAlpha = 0.6;
      strokeHatch(ctx, scr, item.hatch, item.color);
      ctx.beginPath();
      scr.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.closePath();
      ctx.globalAlpha = 0.9;
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = CANVAS.preview;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.restore();
  },
};
