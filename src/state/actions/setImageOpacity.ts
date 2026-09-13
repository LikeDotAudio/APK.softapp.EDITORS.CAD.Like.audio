// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';

export function setImageOpacity(store: EditorStore, opacity: number): void {
  if (!store.tracing) return;
  store.tracing.opacity = opacity;
  store.requestDraw();
  store.emit();

}
