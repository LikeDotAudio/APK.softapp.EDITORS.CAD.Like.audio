// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Point } from '../core/types';
import { pointInPolygon } from '../geometry/polygon/pointInPolygon';
import { addPaletteFill } from '../model/palette/addPaletteFill';
import { closedLoopAt } from '../model/palette/closedLoopAt';
import { metresToUnits } from '../model/palette/metresToUnits';
import { regionAt, tileCentres } from '../model/palette/regionAt';
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
 *   a product (it has a size)  click → by the panel's Fit: the block, true
 *                              size, centred there (place); the region the
 *                              click is in painted with it (fill); or blocks at
 *                              true size across that region, as many as fit
 *                              whole (tile)
 *   a finish                   drag a rectangle → that region painted;
 *                              click inside a region → that region painted;
 *                              click elsewhere → click-click rectangle
 *
 * A REGION is the smallest face the layer's lines enclose (regionAt): a
 * wall's outline cut by division lines is one region per bay, so a wall is
 * finished by drawing its division lines and clicking each bay. A simple
 * closed outline is a region too.
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
  /** The region a click would paint, outlined under the cursor; null when none or not wanted. */
  hoverRegion: Point[] | null;
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

/** The region a click at `p` is in: between the layer's lines, else inside a closed outline. */
function regionUnder(api: ToolApi, p: Point): Point[] | null {
  return regionAt(api.doc, p, api.activeLayerId) ?? closedLoopAt(api.doc, p, api.activeLayerId);
}

/** A product clicked with Fit set to fill or tile; false when there is no region there (it is placed instead). */
function fitProduct(api: ToolApi, p: Point): boolean {
  const item = api.paletteItem;
  if (!item?.size || api.paletteFit === 'place') return false;
  const region = regionUnder(api, p);
  if (!region) return false;
  if (api.paletteFit === 'fill') {
    paintRegion(api, region);
    return true;
  }
  const w = metresToUnits(item.size[0], api.units);
  const h = metresToUnits(item.size[1], api.units);
  const centres = tileCentres(region, w, h);
  if (!centres.length) {
    api.showHint(`${item.name} does not fit whole in that region — Fit: fill paints it instead.`, 2500);
    return true;
  }
  api.edit(() => centres.map((c) => placePaletteBlock(api.doc, item, api.units, c, 0, api.activeLayerId)).some((id) => id !== null));
  api.showHint(`Tiled ${centres.length} × ${item.name}.`, 1500);
  return true;
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

  createState: () => ({ start: null, startScreen: null, clicking: false, hover: null, hoverRegion: null }),
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
      if (fitProduct(api, input.rawWorld)) return;
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
    const item = api.paletteItem;
    const wantsRegion = item && !state.start && (!item.size || api.paletteFit !== 'place');
    state.hoverRegion = wantsRegion ? regionUnder(api, input.rawWorld) : null;
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
    const loop = regionUnder(api, input.rawWorld);
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
    if (state.hoverRegion) {
      const scr = state.hoverRegion.map((p) => view.toScreen(p.x, p.y));
      ctx.beginPath();
      scr.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.closePath();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = item.color;
      ctx.fill();
      ctx.globalAlpha = 0.95;
      ctx.strokeStyle = item.color;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if (item.size && (scene.paletteFit ?? 'place') === 'place') {
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
