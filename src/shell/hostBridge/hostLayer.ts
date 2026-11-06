// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '@state/EditorStore';
import { applyLayerStyle } from '@state/actions/setLayerStyle';

/**
 * A HOST KEEPS A LAYER
 *
 * `layer { name, color?, finish?, lineweight? }` makes sure a layer of that name exists —
 * without making it current, so the user's drawing layer does not jump —
 * colours a new one, re-colours an existing one when a different `color` comes, and sets its finish when `finish` is given (a palette
 * id, or null to clear it). The acoustic overlay keeps a "<room> · Finishes"
 * layer beside every room this way. `lineweight` (hundredths of a millimetre,
 * snapped to a DXF step; null back to Default) is how heavy the layer's line
 * work is drawn — the Simulation's WEIGHT knob sends its wire and box layers
 * with it. Returns whether anything changed.
 */
export function ensureHostLayer(store: EditorStore, msg: { name?: unknown; color?: unknown; finish?: unknown; lineweight?: unknown }): boolean {
  const { name, color, finish, lineweight } = msg;
  if (typeof name !== 'string' || !name.trim()) return false;
  let changed = false;
  if (!store.layers.has(name)) {
    const active = store.activeLayerId;
    store.addLayer(name, typeof color === 'string' ? color : undefined);
    store.activeLayerId = active;
    changed = true;
  }
  const layer = store.layers.get(name);
  // A host may RE-colour its own layer: the Simulation's wiring fader fades the
  // wire layers toward the ground by sending them again with a new colour.
  if (layer && !changed && typeof color === 'string' && color && layer.color !== color) {
    if (typeof store.setLayerColor === 'function') store.setLayerColor(name, color);
    else layer.color = color;
    changed = true;
  }
  if (layer && finish !== undefined && (finish === null || typeof finish === 'string') && (layer.finish ?? null) !== finish) {
    store.setLayerFinish(name, finish);
    changed = true;
  }
  if (layer && (lineweight === null || (typeof lineweight === 'number' && Number.isFinite(lineweight) && lineweight >= 0))
      && applyLayerStyle(layer, { lineweight: lineweight as number | null })) changed = true;
  if (changed) {
    store.requestDraw();
    store.emit();
  }
  return changed;
}
