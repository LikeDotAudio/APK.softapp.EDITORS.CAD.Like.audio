// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';

export function toggleImageVisible(store: EditorStore): void {
  if (!store.tracing) return;
  store.tracing.visible = !store.tracing.visible;
  store.requestDraw();
  store.emit();

}
