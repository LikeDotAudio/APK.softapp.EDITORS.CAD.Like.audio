// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { placePaletteBlock } from '../../model/palette/placePaletteBlock';
import type { EditorStore } from '@state/EditorStore';

/**
 * A HOST FURNISHES THE SHEET
 *
 * `place { layer, items: [{ paletteId, at: [x, y], rotation? }] }` puts real
 * palette blocks on the sheet — the console, the couch, the rack a library
 * room comes with — exactly as if the user had placed them from the Palette:
 * true size, `paletteId` on the instance, movable and deletable like any
 * block, and all of them ONE undo step. Unlike marks they are the user's from
 * then on; the host never moves them again. Items whose id is not a product
 * in the current palette are skipped. Returns how many were placed.
 */
export function placeHostItems(store: EditorStore, msg: { layer?: unknown; items?: unknown }): number {
  const { layer, items } = msg;
  if (typeof layer !== 'string' || !layer.trim() || !Array.isArray(items)) return 0;
  const before = store.doc.snapshot();
  if (!store.layers.has(layer)) {
    const active = store.activeLayerId;
    store.addLayer(layer);
    store.activeLayerId = active;
  }
  let n = 0;
  for (const it of items as { paletteId?: unknown; at?: unknown; rotation?: unknown }[]) {
    const item = typeof it?.paletteId === 'string' ? store.palette?.items.find((i) => i.id === it.paletteId && i.size) : undefined;
    const at = it?.at;
    if (!item || !Array.isArray(at) || at.length !== 2 || !at.every((v) => typeof v === 'number' && Number.isFinite(v))) continue;
    const rotation = typeof it.rotation === 'number' && Number.isFinite(it.rotation) ? it.rotation : 0;
    if (placePaletteBlock(store.doc, item, store.units, { x: at[0], y: at[1] }, rotation, layer) !== null) n++;
  }
  if (!n) return 0;
  store.history.push(before);
  store.markDocChanged();
  store.requestDraw();
  store.emit();
  return n;
}
