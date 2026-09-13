// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';

export function showHint(store: EditorStore, message: string, durationMs = 5000): void {
  store.hintText = message;
  store.hintVisible = true;
  if (store.hintTimer) clearTimeout(store.hintTimer);
  store.hintTimer = null;
  if (durationMs > 0) {
    store.hintTimer = setTimeout(() => {
      store.hintVisible = false;
      store.emit();
    }, durationMs);
  }
  store.emit();

}
