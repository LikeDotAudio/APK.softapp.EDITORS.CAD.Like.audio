// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';

/**
 * The schematic counterpart of `edit()`. It repaints and notifies exactly as
 * that one does; what it does NOT do is push onto the undo stack, because
 * `History` snapshots the geometry `Doc` and the schematic is not in that
 * snapshot. Kept in one place so the day the snapshot widens, one file changes.
 */
export function editFlow(store: EditorStore, mutate: () => boolean): boolean {
  const changed = mutate();
  if (!changed) return false;
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
