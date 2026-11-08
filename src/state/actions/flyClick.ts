// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { definitionFor } from '../../flow/Schematic';
import { endName, resolvePortal, toggleFly } from '../../flow/fly';
import { hostPicked, pickHost } from '../../flow/hostSelection';
import { flyHitAt } from '../../render/flow/flyHits';
import type { EditorStore } from '../EditorStore';

/**
 * A CLICK ON A FLY CAPSULE GOES TO ITS FAR END (flow/fly.ts). On this sheet: the
 * view closes in on the far block and picks it, and says which port. On another
 * drawing: says which — opening it from here is the Simulation's pages (ROAD-3666).
 * A press that travelled was a pan or a drag, not a click.
 */
type Store = Pick<EditorStore, 'schematic' | 'view' | 'canvas' | 'requestDraw' | 'emit' | 'showHint'>;

export function goToFlyAt(store: Store, x: number, y: number): boolean {
  const hit = flyHitAt(x, y);
  if (!hit) return false;
  const target = resolvePortal(store.schematic, hit.far);
  if (!target) { store.showHint(`${hit.far.text}: not on this drawing.`, 4000); return true; }
  if (target.drawing) { store.showHint(`${hit.far.text} — on the drawing “${target.drawing}”.`, 5000); return true; }
  const placement = store.schematic.placements.find((p) => p.id === target.placementId);
  const def = placement ? definitionFor(store.schematic, placement) : undefined;
  if (!placement || !def) return true;
  const s = placement.scale ?? 1;
  const hw = (def.size.w / 2) * s * 1.6;
  const hh = (def.size.h / 2) * s * 1.6;
  store.view.zoomToFit({ x1: placement.at.x - hw, y1: placement.at.y - hh, x2: placement.at.x + hw, y2: placement.at.y + hh });
  pickHost(store.schematic, [placement.id]);
  store.showHint(`→ ${target.portId ? endName(store.schematic, { placementId: placement.id, portId: target.portId }) : placement.refdes ?? `#${placement.id}`}`, 4000);
  store.requestDraw();
  store.emit();
  return true;
}

export function installFlyClick(store: Store): void {
  if (typeof window === 'undefined') return;
  let down: { x: number; y: number } | null = null;
  window.addEventListener('mousedown', (e) => {
    down = store.canvas && e.target === store.canvas && e.button === 0 ? { x: e.clientX, y: e.clientY } : null;
  }, true);
  window.addEventListener('click', (e) => {
    if (!store.canvas || e.target !== store.canvas || e.button !== 0 || !down) return;
    if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 4) return;
    const r = store.canvas.getBoundingClientRect();
    goToFlyAt(store, e.clientX - r.left, e.clientY - r.top);
  });
}

/** Modify › the picked blocks' wires as fly pairs, or lines again. */
export function toggleFlyOfPicked(store: Store & Pick<EditorStore, 'editFlow'>): void {
  const ids = hostPicked(store.schematic);
  if (!ids.length) { store.showHint('Pick a block first: its wires become fly-offs / fly-ons.', 4000); return; }
  let n = 0;
  store.editFlow(() => (n = toggleFly(store.schematic, ids)) > 0);
  store.showHint(n ? `${n} wire${n === 1 ? '' : 's'} switched between line and fly-off / fly-on.` : 'The picked blocks have no wires.', 4000);
  store.requestDraw();
}
