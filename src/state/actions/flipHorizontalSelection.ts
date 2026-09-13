// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';

export function flipHorizontalSelection(store: EditorStore): void {
  if (store.selection.size === 0) return;
  store.history.push(store.doc.snapshot());
  store.doc.flipHorizontal(store.selection);
  store.markDocChanged();
  store.requestDraw();
  store.emit();
  store.showHint(`Flipped ${store.selection.size} element(s) horizontally.`, 3000);

}
