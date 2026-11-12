// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { SchematicModel } from '../core/types';

/**
 * WHICH WIRE IS SELECTED — one at a time, the whole wire (the owner: "select it once and
 * the whole net highlights"). Kept beside the model, not in it, like hostSelection.ts: a
 * selection is not part of a saved drawing. An id that no longer names a wire reads as none.
 */
const chosen = new WeakMap<SchematicModel, { wire: number | null }>();

export function selectedWire(model: SchematicModel): number | null {
  const id = chosen.get(model)?.wire ?? null;
  return id !== null && model.connectors.some((c) => c.id === id) ? id : null;
}

/** Select a wire (null: none). True when the selection changed. */
export function selectWire(model: SchematicModel, id: number | null): boolean {
  const before = selectedWire(model);
  chosen.set(model, { wire: id });
  return before !== selectedWire(model);
}
