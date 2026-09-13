// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';

export function markDocChanged(store: EditorStore): void {
  store.docVersion++;
  if (store.autoSaveTimer) clearTimeout(store.autoSaveTimer);
  store.autoSaveTimer = setTimeout(() => {
    void store.autoSaveSession();
  }, 500);

}
