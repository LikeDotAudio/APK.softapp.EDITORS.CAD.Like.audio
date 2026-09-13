// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';

export function edit(store: EditorStore, mutate: () => boolean): void {
  const before = store.doc.snapshot();
  if (mutate()) {
    store.history.push(before);
    store.markDocChanged();
  }
  store.requestDraw();
  store.emit();

}
