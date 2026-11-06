// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '@state/EditorStore';
import { applyLayerStyle } from '@state/actions/setLayerStyle';
import { parseRating } from '@state/actions/roomsAndWalls';
import type { LayerIfc } from '../../core/types';

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
 * with it. `ifc` classifies the layer for the IFC export: { entity: 'IfcWall',
 * predefinedType?, height_mm?, thickness_mm?, isExternal?, loadBearing?,
 * acousticRating?, fireRating? } makes its edges IfcWalls, with the
 * Pset_WallCommon facts the host states (2.11.0) (null
 * clears it). Returns whether anything changed.
 */
export function ensureHostLayer(store: EditorStore, msg: { name?: unknown; color?: unknown; finish?: unknown; lineweight?: unknown; ifc?: unknown }): boolean {
  const { name, color, finish, lineweight, ifc } = msg;
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
  // `ifc` { entity: 'IfcWall', predefinedType?, height_mm?, thickness_mm?, isExternal?, loadBearing?,
  // acousticRating?, fireRating? } classifies the layer's
  // linework for the IFC export (cad-4); null takes the classification off
  if (layer && ifc !== undefined) {
    const next = parseLayerIfc(ifc);
    if (next !== undefined && JSON.stringify(layer.ifc ?? null) !== JSON.stringify(next)) {
      if (next) layer.ifc = next;
      else delete layer.ifc;
      changed = true;
    }
  }
  if (changed) {
    store.requestDraw();
    store.emit();
  }
  return changed;
}

/** A layer's IFC classification from a host: the value, null to clear, undefined when it is not one. */
export function parseLayerIfc(v: unknown): LayerIfc | null | undefined {
  if (v === null) return null;
  if (!v || typeof v !== 'object') return undefined;
  const o = v as Record<string, unknown>;
  if (o.entity !== 'IfcWall') return undefined;
  const out: LayerIfc = { entity: 'IfcWall' };
  if (typeof o.predefinedType === 'string' && /^[A-Z_]+$/.test(o.predefinedType)) out.predefinedType = o.predefinedType;
  for (const k of ['height_mm', 'thickness_mm'] as const) {
    const n = o[k];
    if (typeof n === 'number' && Number.isFinite(n) && n > 0) out[k] = n;
  }
  // Pset_WallCommon, as the host states it (2.11.0): yes/no facts, and ratings as written
  for (const k of ['isExternal', 'loadBearing'] as const) {
    if (typeof o[k] === 'boolean') out[k] = o[k];
  }
  for (const k of ['acousticRating', 'fireRating'] as const) {
    const r = typeof o[k] === 'string' ? parseRating(o[k]) : undefined;
    if (typeof r === 'string') out[k] = r;
  }
  return out;
}
