// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '@state/EditorStore';

/**
 * A HOST KEEPS A LAYER
 *
 * `layer { name, color?, finish? }` makes sure a layer of that name exists —
 * without making it current, so the user's drawing layer does not jump —
 * colours a new one, and sets its finish when `finish` is given (a palette
 * id, or null to clear it). The acoustic overlay keeps a "<room> · Finishes"
 * layer beside every room this way. Returns whether anything changed.
 */
export function ensureHostLayer(store: EditorStore, msg: { name?: unknown; color?: unknown; finish?: unknown }): boolean {
  const { name, color, finish } = msg;
  if (typeof name !== 'string' || !name.trim()) return false;
  let changed = false;
  if (!store.layers.has(name)) {
    const active = store.activeLayerId;
    store.addLayer(name, typeof color === 'string' ? color : undefined);
    store.activeLayerId = active;
    changed = true;
  }
  const layer = store.layers.get(name);
  if (layer && finish !== undefined && (finish === null || typeof finish === 'string') && (layer.finish ?? null) !== finish) {
    store.setLayerFinish(name, finish);
    changed = true;
  }
  if (changed) {
    store.requestDraw();
    store.emit();
  }
  return changed;
}
