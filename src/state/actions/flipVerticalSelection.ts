// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';

export function flipVerticalSelection(store: EditorStore): void {
  if (store.selection.size === 0) return;
  store.history.push(store.doc.snapshot());
  store.doc.flipVertical(store.selection);
  store.markDocChanged();
  store.requestDraw();
  store.emit();
  store.showHint(`Flipped ${store.selection.size} element(s) vertically.`, 3000);

}
