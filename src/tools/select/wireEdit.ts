// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { Point } from '../../core/types';
import { hitConnectorAt } from '../../flow/cables';
import { nudgeOnGrid, snapAt } from '../../flow/onGrid';
import { hitPlacementAt, hitPortAt } from '../../flow/Schematic';
import { selectedWire, selectWire } from '../../flow/wireSelection';
import { addBend, deleteWire, endPoint, followDevice, moveBend, nearestSegment, ownBends, removeBend, slideSegment, wireEndsOf } from '../../flow/wires';
import type { PointerInput, ToolApi } from '../types';

/**
 * THE SELECT TOOL ON A WIRE (the owner, 2026-11-11: "this net should act like a single line
 * with bends"). A click selects the WHOLE wire; on a selected wire a bend drags as a corner
 * and a run slides square (its neighbours follow); a double-click adds a bend on a run or
 * takes away the bend under it; Delete takes the wire away. A device the user placed drags
 * by its body and its wires' ends go with it, their bends squaring up (wires.followDevice).
 * All the geometry is flow/wires.ts's pure math; this file only maps the pointer to it.
 * Every change is one undo step (editFlow, at the first move).
 */

export type WireDrag =
  | { kind: 'bend'; wire: number; index: number; path: Point[]; undo: boolean }
  | { kind: 'segment'; wire: number; index: number; path: Point[]; start: Point; undo: boolean }
  | { kind: 'device'; placementId: number; last: Point; undo: boolean };

const HIT_PX = 8;

/** The selected wire's path, pin to pin, its bends its own. */
function pathOfWire(api: ToolApi, id: number): Point[] | null {
  const c = api.schematic.connectors.find((w) => w.id === id);
  if (!c) return null;
  const a = endPoint(api.schematic, c.from), b = endPoint(api.schematic, c.to);
  return a && b ? [a, ...ownBends(api.schematic, c), b] : null;
}

/** A press: true when a wire (or a user's device) took it. */
export function wirePointerDown(input: PointerInput, api: ToolApi): WireDrag | null | false {
  const model = api.schematic;
  if (!model) return false;
  const tol = api.view.pxToWorld(HIT_PX);
  const sel = selectedWire(model);
  if (sel !== null) {
    const path = pathOfWire(api, sel);
    if (path) {
      const bend = path.slice(1, -1).findIndex((p) => Math.hypot(p.x - input.rawWorld.x, p.y - input.rawWorld.y) <= tol);
      if (bend >= 0) return { kind: 'bend', wire: sel, index: bend, path, undo: false };
      const seg = nearestSegment(path, input.rawWorld);
      if (seg && seg.d <= tol) return { kind: 'segment', wire: sel, index: seg.index, path, start: input.rawWorld, undo: false };
    }
  }
  const onBlock = hitPlacementAt(model, input.rawWorld);
  if (!onBlock && !hitPortAt(model, input.rawWorld, tol)) {
    const hit = hitConnectorAt(model, input.rawWorld, tol);
    if (hit !== null) {
      selectWire(model, hit);
      api.selection.clear();
      api.redraw();
      return null;
    }
  }
  if (sel !== null) selectWire(model, null);
  // the user's own device (a host's drags by hostDrag.ts): its body drags it, its wires follow
  if (onBlock && !onBlock.hostKey) {
    api.selection.clear();
    return { kind: 'device', placementId: onBlock.id, last: input.rawWorld, undo: false };
  }
  return false;
}

export function wirePointerMove(drag: WireDrag, input: PointerInput, api: ToolApi): void {
  const model = api.schematic;
  const once = () => {
    if (drag.undo) return;
    api.editFlow(() => true);   // the step undo goes back to, taken before the first change
    drag.undo = true;
  };
  if (drag.kind === 'device') {
    const p = model.placements.find((x) => x.id === drag.placementId);
    if (!p) return;
    const dx = input.rawWorld.x - drag.last.x, dy = input.rawWorld.y - drag.last.y;
    if (!dx && !dy) return;
    once();
    const before = wireEndsOf(model, p.id);
    nudgeOnGrid(p, dx, dy);
    followDevice(model, p.id, before);
    drag.last = input.rawWorld;
    api.redraw();
    return;
  }
  const c = model.connectors.find((w) => w.id === drag.wire);
  if (!c) return;
  once();
  if (drag.kind === 'bend') c.route = moveBend(drag.path, drag.index, snapAt(input.rawWorld));
  else {
    const d = { x: input.rawWorld.x - drag.start.x, y: input.rawWorld.y - drag.start.y };
    const s = snapAt(d);
    c.route = slideSegment(drag.path, drag.index, s);
  }
  api.setMeasurement(`${drag.kind === 'bend' ? 'Bend' : 'Run'} · ${c.route.length} bend${c.route.length === 1 ? '' : 's'}`);
  api.redraw();
}

/** A double-click on the selected wire: a bend under it goes, else one is added there. */
export function wireDoubleClick(input: PointerInput, api: ToolApi): boolean {
  const model = api.schematic;
  const sel = model ? selectedWire(model) : null;
  if (sel === null) return false;
  const path = pathOfWire(api, sel);
  if (!path) return false;
  const tol = api.view.pxToWorld(HIT_PX);
  const bend = path.slice(1, -1).findIndex((p) => Math.hypot(p.x - input.rawWorld.x, p.y - input.rawWorld.y) <= tol);
  const seg = nearestSegment(path, input.rawWorld);
  if (bend < 0 && (!seg || seg.d > tol)) return false;
  api.editFlow(() => {
    const c = model.connectors.find((w) => w.id === sel)!;
    c.route = bend >= 0 ? removeBend(path.slice(1, -1), bend) : addBend(path, snapAt(seg!.at)).bends;
    return true;
  });
  api.showHint(bend >= 0 ? 'Bend taken away · Ctrl+Z puts it back.' : 'Bend added — drag it to make the corner.', 2500);
  return true;
}

/** Delete with a wire selected: the wire goes (its net splits if it held it together). */
export function wireDelete(api: ToolApi): boolean {
  const model = api.schematic;
  const sel = model ? selectedWire(model) : null;
  if (sel === null) return false;
  api.editFlow(() => deleteWire(model, sel));
  selectWire(model, null);
  api.showHint('Wire deleted · Ctrl+Z brings it back.', 2500);
  return true;
}
