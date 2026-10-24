// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../../state/EditorStore';
import type { Doc } from '../../model/Doc';
import type { HostXY } from './sceneForHost';

/**
 * A HOST JUMPS THE SHEET TO ONE OF ITS DRAWINGS
 *
 * One CAD file can hold several drawings of the same thing side by side — the
 * acoustic overlay keeps the plan and its four wall elevations on one sheet,
 * each on its own layer. `sheet { layer, color?, seed? }` takes the user there:
 * the layer is made (if new), shown and made current, and the view zooms to
 * what is on it. A layer with nothing on it yet gets the host's `seed` drawn
 * as a closed outline first, so there is something to edit — one undo step,
 * and never mirrored: it is the host's picture of the room, already whole.
 */

/** Every edge on a layer. */
export function layerEdgeIds(doc: Doc, layerId: string): number[] {
  const ids: number[] = [];
  for (const e of doc.edges.values()) if (e.layerId === layerId) ids.push(e.id);
  return ids;
}

/** Draws `seed` as a closed outline on `layerId`; returns the new edge ids. */
export function drawSeed(doc: Doc, layerId: string, seed: readonly HostXY[]): number[] {
  const ids: number[] = [];
  for (let i = 0; i < seed.length; i++) {
    const [ax, ay] = seed[i]!;
    const [bx, by] = seed[(i + 1) % seed.length]!;
    const id = doc.addLine({ x: ax, y: ay }, { x: bx, y: by }, 0, layerId);
    if (id !== null) ids.push(id);
  }
  return ids;
}

function validSeed(seed: unknown): seed is HostXY[] {
  return (
    Array.isArray(seed) &&
    seed.length >= 3 &&
    seed.every((p) => Array.isArray(p) && p.length === 2 && p.every((n) => typeof n === 'number' && Number.isFinite(n)))
  );
}

export function showHostSheet(store: EditorStore, layer: string, color?: unknown, seed?: unknown): void {
  if (!store.layers.has(layer)) store.addLayer(layer, typeof color === 'string' ? color : undefined);
  const l = store.layers.get(layer);
  if (!l) return;
  l.visible = true;
  store.setActiveLayer(layer);

  let ids = layerEdgeIds(store.doc, layer);
  if (!ids.length && validSeed(seed) && !l.locked) {
    const before = store.doc.snapshot();
    ids = drawSeed(store.doc, layer, seed);
    if (ids.length) {
      store.history.push(before);
      store.markDocChanged();
    }
  }
  const bounds = ids.length ? store.doc.boundsOf(ids) : null;
  if (bounds) store.view.zoomToFit(bounds);
  store.requestDraw();
  store.emit();
}
