// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { SchematicModel } from '../../core/types';
import type { EditorStore } from '../EditorStore';

/** A deep copy of the schematic for the undo stack: plain data, so a JSON round trip is exact. */
export function cloneSchematic(model: SchematicModel): SchematicModel {
  return JSON.parse(JSON.stringify(model)) as SchematicModel;
}

/** Put a copied schematic back INTO the live model (the store holds one model object for its whole life). */
export function restoreWholeSchematic(model: SchematicModel, saved: SchematicModel): void {
  Object.assign(model, cloneSchematic(saved));
}

/**
 * The schematic counterpart of `edit()`: one undo step (the drawing AND the schematic as
 * they were — the snapshot widened 2026-11-11 so a dropped connector, a wire, a bend or a
 * net comes back with Ctrl+Z), then the repaint and the notice exactly as `edit()` does.
 */
export function editFlow(store: EditorStore, mutate: () => boolean): boolean {
  const before = { ...store.doc.snapshot(), schematic: cloneSchematic(store.schematic) };
  const changed = mutate();
  if (!changed) return false;
  store.history.push(before);
  /* The filed sheet and the one on screen have parted. Said here rather than in
     each caller: every schematic mutation in the app comes through this
     function, which is the only reason the flag can be trusted. */
  if (store.bigPicture.filed || store.schematic.placements.length > 0) {
    store.bigPicture = { ...store.bigPicture, dirty: true };
  }
  store.markDocChanged();
  store.requestDraw();
  store.emit();
  return true;
}
