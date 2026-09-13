// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';

export function emit(store: EditorStore): void {
  store.uiSnapshot = store.buildUi();
  for (const listener of store.listeners) listener();

}
