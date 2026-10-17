// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';

/**
 * Duplicates selected entities (or all if nothing selected) and mirrors them
 * horizontally across the virtual mirror axis at store.mirror.x.
 */
export function reflectSelectionAcrossMirror(store: EditorStore): void {
  const targetIds = store.selection.size > 0 ? store.selection : [];
  const before = store.doc.snapshot();

  const result = store.doc.reflectAcrossMirror(targetIds, store.mirror.x);
  const totalReflected =
    result.edgeIds.length +
    result.textIds.length +
    result.blockIds.length +
    result.fillIds.length;

  if (totalReflected === 0) {
    store.showHint('No elements found to reflect across virtual mirror.', 2500);
    return;
  }

  store.history.push(before);
  store.markDocChanged();

  // Select the newly mirrored elements so user can immediately see or manipulate them
  store.selection.clear();
  for (const id of result.edgeIds) store.selection.add(id);
  for (const id of result.textIds) store.selection.add(id);
  for (const id of result.blockIds) store.selection.add(id);
  for (const id of result.fillIds) store.selection.add(id);

  store.requestDraw();
  store.emit();
  store.showHint(
    `Mirrored ${totalReflected} element(s) horizontally across virtual mirror (X = ${store.mirror.x.toFixed(2)}).`,
    3500,
  );
}
