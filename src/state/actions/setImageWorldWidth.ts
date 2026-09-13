// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import type { EditorStore } from '../EditorStore';

export function setImageWorldWidth(store: EditorStore, width: number): void {
  if (!store.tracing) return;
  store.tracing.worldWidth = width > 0 ? width : 0.1;
  store.requestDraw();
  store.emit();

}
